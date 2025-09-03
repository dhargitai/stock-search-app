export default function HomePage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='hero min-h-96'>
        <div className='hero-content text-center'>
          <div className='max-w-md'>
            <h1 className='text-5xl font-bold text-primary'>Peak Finance</h1>
            <p className='py-6 text-lg'>
              Your comprehensive stock search and analysis platform. Search for
              stocks, analyze financial data, and make informed investment
              decisions.
            </p>
            <button className='btn btn-primary'>Get Started</button>
          </div>
        </div>
      </div>
    </div>
  );
}