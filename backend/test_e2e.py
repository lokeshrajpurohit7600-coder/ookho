import time
import httpx

def test_live_servers():
    print(">>> 1. Testing FastAPI backend health...")
    backend_url = "http://127.0.0.1:8000"
    with httpx.Client(timeout=10.0) as client:
        res = client.get(f"{backend_url}/api/health")
        assert res.status_code == 200, f"Health check failed: {res.status_code}"
        print("Backend is healthy:", res.json())

        # Test upload
        print("\n>>> 2. Testing POST /api/uploads with synthetic sample image...")
        dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        files = {"file": ("forensic_test.png", dummy_png, "image/png")}
        upload_res = client.post(f"{backend_url}/api/uploads", files=files)
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.status_code} - {upload_res.text}"
        upload_data = upload_res.json()
        upload_id = upload_data["id"]
        print(f"Upload created: ID={upload_id}, status={upload_data['status']}, type={upload_data['file_type']}")

        # Test polling
        print("\n>>> 3. Testing GET /api/reports/{upload_id} polling...")
        done = False
        for attempt in range(10):
            time.sleep(0.5)
            rep_res = client.get(f"{backend_url}/api/reports/{upload_id}")
            assert rep_res.status_code == 200
            rep = rep_res.json()
            print(f"  Attempt {attempt + 1}: status = {rep['status']}")
            if rep["status"] == "done":
                done = True
                print("\nReport details received:")
                print(f"  - AI Confidence: {rep['ai_confidence']}%")
                print(f"  - Edit Confidence: {rep['edit_confidence']}%")
                print(f"  - Techniques: {rep['detected_techniques']}")
                print(f"  - Summary: {rep['summary_text'][:90]}...")
                print(f"  - Edited Regions Count: {len(rep['edited_regions'])}")
                break

        assert done, "Polling failed to reach 'done' status within timeout"

        # Test frontend
        print("\n>>> 4. Testing Next.js Frontend landing page...")
        frontend_url = "http://localhost:3000"
        front_res = client.get(frontend_url)
        assert front_res.status_code == 200, f"Frontend landing page failed: {front_res.status_code}"
        assert "Aookho" in front_res.text or "aookho" in front_res.text.lower(), "Landing page missing Aookho branding"
        print("Frontend landing page is running and responding with 200 OK!")

        # Test frontend report page
        print(f"\n>>> 5. Testing Next.js Report page /report/{upload_id}...")
        report_page_res = client.get(f"{frontend_url}/report/{upload_id}")
        assert report_page_res.status_code == 200, f"Report page failed: {report_page_res.status_code}"
        print(f"Frontend report page rendered successfully with 200 OK!")

    print("\n==============================================")
    print("ALL END-TO-END VERIFICATION CHECKS PASSED 100%!")
    print("==============================================")

if __name__ == "__main__":
    test_live_servers()
