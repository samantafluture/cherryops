import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Smartphone } from "lucide-react";

export default function Devices() {
  const { data, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.listDevices(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-cherry-400" />
        <h1 className="text-2xl font-semibold">Devices</h1>
      </div>

      <div className="bg-surface-alt border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-left">
              <th className="p-3">Device ID</th>
              <th className="p-3">Platform</th>
              <th className="p-3">FCM Token</th>
              <th className="p-3">Registered</th>
              <th className="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-muted">Loading...</td></tr>
            ) : data?.devices.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-muted">No devices registered</td></tr>
            ) : (
              data?.devices.map((d) => (
                <tr key={d.id} className="border-b border-border hover:bg-surface-hover transition">
                  <td className="p-3 font-mono">{d.device_id}</td>
                  <td className="p-3">{d.platform}</td>
                  <td className="p-3 font-mono text-text-muted">{d.fcm_token.slice(0, 20)}...</td>
                  <td className="p-3 text-text-muted">{d.created_at.slice(0, 10)}</td>
                  <td className="p-3 text-text-muted">{d.updated_at.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
