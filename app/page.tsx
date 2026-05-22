export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h2 className="text-3xl font-bold">KBO 매직넘버 트래커</h2>
      <p className="text-muted-foreground text-lg">
        KBO 리그 순위와 우승 매직넘버를 실시간으로 확인하세요.
      </p>
      <p className="text-sm text-muted-foreground">
        순위표 및 매직넘버 UI는 다음 PR에서 구현됩니다.
      </p>
    </div>
  );
}
