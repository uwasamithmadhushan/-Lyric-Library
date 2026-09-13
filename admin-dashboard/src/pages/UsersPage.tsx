import { useEffect, useState } from 'react';
import { api, getErrorMessage, type AdminUser } from '../lib/api';
import { EmptyState, formatDate } from '../components/ui';
import { useToast } from '../lib/toast';

export function UsersPage() {
  const { notify } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/users')
      .then((res) => setUsers(res.data.users))
      .catch((error) => notify(getErrorMessage(error), 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  return (
    <div>
      <h1 className="text-3xl font-bold">Users</h1>
      <p className="mt-1 text-slate-500">Accounts stored in the shared backend. Mobile listeners do not have admin access.</p>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="space-y-3 p-6">{[1, 2].map((row) => <div key={row} className="skeleton h-14" />)}</div>
        ) : users.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No users found." body="The admin seed account should appear after the backend starts." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
