import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import About from "@/components/About";
import Footer from "@/components/Footer";
import { getEditionByDate, newsEditions } from "@/lib/news";

type EditionPageProps = {
  params: Promise<{ date: string }>;
};

export function generateStaticParams() {
  return newsEditions.map((edition) => ({ date: edition.dateTime }));
}

export async function generateMetadata({ params }: EditionPageProps): Promise<Metadata> {
  const { date } = await params;
  const edition = getEditionByDate(date);
  if (!edition) return {};

  return {
    title: `${edition.date} | The 7 PM File`,
    description: edition.summary,
  };
}

export default async function NewsEditionPage({ params }: EditionPageProps) {
  const { date } = await params;
  const edition = getEditionByDate(date);
  if (!edition) notFound();

  return (
    <div className="brand">
      <Header />
      <main>
        <About brief={edition} archived />
      </main>
      <Footer />
    </div>
  );
}
