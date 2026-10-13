import ReportClient from './ReportClient';

export function generateStaticParams() {
  return [
    { id: 'sample' }
  ];
}

export default function Page() {
  return <ReportClient />;
}
