import { Lightbulb } from 'lucide-react';

export default function LampVisual({ isOn = true }) {
  return (
    <div className={`lamp-visual ${isOn ? 'on' : 'off'}`}>
      <div className="lamp-glow" />
      <Lightbulb size={84} strokeWidth={1.5} fill={isOn ? 'currentColor' : 'none'} />
      <div className="lamp-base" />
    </div>
  );
}
