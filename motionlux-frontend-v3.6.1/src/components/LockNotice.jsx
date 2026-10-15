import { Lock } from 'lucide-react';

export default function LockNotice() {
  return (
    <div className="lock-notice">
      <Lock size={20} />
      <div>
        <strong>Lampu sedang di-shutdown oleh admin</strong>
        <span>Lampu tidak dapat dinyalakan sampai admin mengaktifkannya kembali.</span>
      </div>
    </div>
  );
}
