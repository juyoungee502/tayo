import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminPageData } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

export default async function AdminPage() {
  const { users, parties, reports, deletionRequests } = await getAdminPageData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">관리자 페이지</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">관리자 권한이 있는 계정만 접근할 수 있는 보호 페이지입니다.</p>
      </div>

      <Notice variant="warning">관리자 계정은 공개 UI에서 만들 수 없고, DB에서 role을 직접 admin으로 변경해야 합니다.</Notice>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-500">사용자</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{users.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">택시팟</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{parties.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">신고</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{reports.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">탈퇴 요청</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{deletionRequests.length}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">사용자 목록</h2>
        {users.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slateBlue">{user.nickname}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="등록된 사용자가 없습니다" description="허용 도메인 계정으로 첫 로그인한 사용자가 생기면 여기에서 확인할 수 있습니다." />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">택시팟 목록</h2>
        {parties.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {parties.map((party) => (
              <div key={party.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slateBlue">{party.departure_place_name} → {party.destination_name}</p>
                    <p className="text-sm text-slate-500">{formatDateTime(party.scheduled_at)}</p>
                  </div>
                  <StatusPill status={party.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="등록된 택시팟이 없습니다" description="사용자가 택시팟을 만들면 이 영역에 리스트가 채워집니다." />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">신고 목록</h2>
        <div className="mt-4 grid gap-3">
          {reports.length > 0 ? reports.map((report) => (
            <div key={report.id} className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4">
              <div className="flex flex-col gap-2 text-sm text-rose-900">
                <p><strong>{report.reporterName}</strong> → <strong>{report.reportedUserName}</strong></p>
                <p>사유: {report.reason}</p>
                <p>시간: {formatDateTime(report.created_at)}</p>
                {report.detail ? <p>상세: {report.detail}</p> : null}
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">등록된 신고가 없습니다.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">탈퇴 요청</h2>
        <div className="mt-4 grid gap-3">
          {deletionRequests.length > 0 ? deletionRequests.map((request) => (
            <div key={request.id} className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
              <p className="font-semibold">사용자 ID: {request.user_id}</p>
              <p className="mt-1">상태: {request.status}</p>
              <p className="mt-1">접수: {formatDateTime(request.created_at)}</p>
              {request.note ? <p className="mt-1">메모: {request.note}</p> : null}
            </div>
          )) : <p className="text-sm text-slate-500">접수된 탈퇴 요청이 없습니다.</p>}
        </div>
      </Card>
    </div>
  );
}

