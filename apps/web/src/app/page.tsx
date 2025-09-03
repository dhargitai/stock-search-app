import { Navbar } from '@/components/ui/navbar';
import { SearchInput } from '@/components/ui/search-input';

export default function HomePage(): JSX.Element {

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-base-content mb-8">
              Find Your Next Winning Stock
            </h1>
            
            <div className="w-full max-w-md mx-auto">
              <SearchInput className="mb-8" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}