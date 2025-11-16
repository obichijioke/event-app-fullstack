import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ category: string; article: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article } = await params;
  return {
    title: article.replace(/-/g, ' '),
    description: 'Help article',
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { category, article } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-primary hover:underline">
            Help Center
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <Link href={`/help/${category}`} className="text-primary hover:underline capitalize">
            {category.replace(/-/g, ' ')}
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-muted-foreground capitalize">{article.replace(/-/g, ' ')}</span>
        </nav>

        {/* Article */}
        <article className="bg-card rounded-lg shadow-card p-8">
          <h1 className="text-3xl font-bold mb-4 capitalize">
            {article.replace(/-/g, ' ')}
          </h1>
          
          <div className="prose prose-slate max-w-none">
            {/* TODO: Article content */}
            <p className="text-muted-foreground">
              Article content will be displayed here. This is a placeholder for the help article.
            </p>
            
            <h2>Overview</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            
            <h2>Step-by-Step Guide</h2>
            <ol>
              <li>First step</li>
              <li>Second step</li>
              <li>Third step</li>
            </ol>
            
            <h2>Additional Information</h2>
            <p>More details about this topic.</p>
          </div>

          {/* Helpful */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm font-medium mb-3">Was this article helpful?</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-success/10 text-success rounded-md hover:bg-success/20 transition text-sm">
                👍 Yes
              </button>
              <button className="px-4 py-2 bg-error/10 text-error rounded-md hover:bg-error/20 transition text-sm">
                👎 No
              </button>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <div className="mt-8 bg-card rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Related Articles</h2>
          <div className="space-y-2">
            <Link href="#" className="block text-primary hover:underline text-sm">
              Related article 1
            </Link>
            <Link href="#" className="block text-primary hover:underline text-sm">
              Related article 2
            </Link>
            <Link href="#" className="block text-primary hover:underline text-sm">
              Related article 3
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Still have questions?
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

