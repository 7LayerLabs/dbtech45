import { redirect } from 'next/navigation';

// AxeCap is now the F5 tab inside the DB Terminal at /ops/markets.
export default function AxeCapPage() {
  redirect('/ops/markets');
}
