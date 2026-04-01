import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminPageData } from "@/lib/queries/data";
import { formatDateTime } from "@/lib/utils";

export default async function AdminPage() {
  const { users, parties, reports, deletionRequests, accessLogs } = await getAdminPageData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-slateBlue">������ ������</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">������ ������ �ִ� ������ ������ �� �ִ� ��ȣ �������Դϴ�.</p>
      </div>

      <Notice variant="warning">������ ������ ���� UI���� ���� �� ����, DB���� role�� ���� admin���� �����ؾ� �մϴ�.</Notice>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-xs text-slate-500">�����</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{users.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">�ý���</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{parties.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">�Ű�</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{reports.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Ż�� ��û</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{deletionRequests.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">�ֱ� ���� �α�</p>
          <p className="mt-2 text-2xl font-semibold text-slateBlue">{accessLogs.length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slateBlue">�ֱ� ���� ���</h2>
            <p className="mt-1 text-sm text-slate-500">���� ���� � ȭ�鿡 ���Դ��� �ֱ� ��� �������� Ȯ���� �� �ֽ��ϴ�.</p>
          </div>
          <p className="text-xs text-slate-400">���� ������� ���� ȭ�� �������� 3�� ������ ��� ����˴ϴ�.</p>
        </div>
        {accessLogs.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {accessLogs.map((log) => (
              <div key={log.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slateBlue">{log.nickname}</p>
                    <p className="text-sm text-slate-500">{log.email ?? log.user_id}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-slate-500 sm:items-end">
                    <p>{formatDateTime(log.created_at)}</p>
                    <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{log.path}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="���� ���� �αװ� �����ϴ�" description="�α����� ����ڰ� ȭ�鿡 ������ �ֱ� ���� ����� �� ������ ǥ�õ˴ϴ�." />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">����� ���</h2>
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
            <EmptyState title="��ϵ� ����ڰ� �����ϴ�" description="��� ������ �������� ù �α����� ����ڰ� ����� ���⿡�� Ȯ���� �� �ֽ��ϴ�." />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">�ý��� ���</h2>
        {parties.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {parties.map((party) => (
              <div key={party.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slateBlue">{party.departure_place_name} �� {party.destination_name}</p>
                    <p className="text-sm text-slate-500">{formatDateTime(party.scheduled_at)}</p>
                  </div>
                  <StatusPill status={party.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="��ϵ� �ý����� �����ϴ�" description="����ڰ� �ý����� ����� �� ������ ����Ʈ�� ä�����ϴ�." />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">�Ű� ���</h2>
        <div className="mt-4 grid gap-3">
          {reports.length > 0 ? reports.map((report) => (
            <div key={report.id} className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4">
              <div className="flex flex-col gap-2 text-sm text-rose-900">
                <p><strong>{report.reporterName}</strong> �� <strong>{report.reportedUserName}</strong></p>
                <p>����: {report.reason}</p>
                <p>�ð�: {formatDateTime(report.created_at)}</p>
                {report.detail ? <p>��: {report.detail}</p> : null}
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">��ϵ� �Ű�� �����ϴ�.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slateBlue">Ż�� ��û</h2>
        <div className="mt-4 grid gap-3">
          {deletionRequests.length > 0 ? deletionRequests.map((request) => (
            <div key={request.id} className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
              <p className="font-semibold">����� ID: {request.user_id}</p>
              <p className="mt-1">����: {request.status}</p>
              <p className="mt-1">����: {formatDateTime(request.created_at)}</p>
              {request.note ? <p className="mt-1">�޸�: {request.note}</p> : null}
            </div>
          )) : <p className="text-sm text-slate-500">������ Ż�� ��û�� �����ϴ�.</p>}
        </div>
      </Card>
    </div>
  );
}
