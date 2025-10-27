import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const ALIASES: Record<string, keyof typeof Icons> = {
  Lightning: 'Zap',
  Switch: 'ToggleLeft',
  FileAlert: 'FileWarning',
  FileShield: 'Shield',
  FilePresentation: 'Presentation',
  FilePdf: 'FileText',
  FileWord: 'FileText',
  FileExcel: 'Table',
  FilePowerpoint: 'Presentation',
};

export function Icon(props: { name: string } & LucideProps) {
  const { name, ...rest } = props;
  const actual = ALIASES[name] ?? (name as keyof typeof Icons);
  const Cmp = (Icons as any)[actual] ?? Icons.File;
  return <Cmp {...rest} />;
}
