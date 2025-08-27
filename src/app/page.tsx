import Player from '@/components/player';

export default function Home() {
  return (
    <main className="h-[75vh] aspect-[16/9] p-16 outline-2 outline-blue-400 grid grid-rows-3">
      <Player />
    </main>
  );
}
