export type SessionType =
  | 'notebook'
  | 'desktop'
  | 'carta'
  | 'contributed'
  | 'firefly';

export interface SessionFormData {
  type: SessionType;
  project: string;
  containerImage: string;
  sessionName: string;
  memory: number;
  cores: number;
  // Advanced tab fields
  repositoryHost?: string;
  image?: string;
  repositoryAuthUsername?: string;
  repositoryAuthSecret?: string;
}

export interface SessionSettings {
  cores: number;
  memory: number;
}

export interface SessionLaunchFormProps {
  onLaunch?: (data: SessionFormData) => void | Promise<void>;
  onReset?: () => void;
  projects?: string[];
  containerImages?: string[];
  memoryOptions?: number[];
  coreOptions?: number[];
  defaultValues?: Partial<SessionFormData>;
  isLoading?: boolean;
  errorMessage?: string | null;
}
