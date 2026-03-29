import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="페이지를 찾을 수 없어요"
      description="주소가 바뀌었거나 존재하지 않는 택시팟입니다. 목록으로 돌아가서 다시 확인해 주세요."
      actionHref="/parties"
      actionLabel="택시팟 목록으로"
    />
  );
}
