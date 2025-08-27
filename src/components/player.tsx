export default function Player() {
  return (
    <>
      <div className="grid grid-cols-3">
        <div>Files</div>
        <div className="col-span-2">Player</div>
      </div>
      <div className="row-span-2 border-t-2 border-blue-400">
        <h3 className="mt-4">Tracks</h3>
      </div>
    </>
  );
}
