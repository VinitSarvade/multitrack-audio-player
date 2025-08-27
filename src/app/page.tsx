import Player from '@/components/player';

export default function Home() {
  return (
    <main className="h-[75vh] aspect-[4/3] p-16 outline-2 outline-blue-400 grid grid-rows-3 gap-8">
      <Player />
    </main>
  );
}
