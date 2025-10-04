import { z } from 'zod';

const appConfig = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '',
};

const configSchema = z.object({
  backendUrl: z.string().min(1),
  googleMapsApiKey: z.string().optional(),
  googleMapsMapId: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export function createConfig(): Config {
  const parsedConfig = configSchema.safeParse(appConfig);

  if (!parsedConfig.success) {
    console.error(parsedConfig.error);
    throw new Error('Configuration error');
  }

  return parsedConfig.data;
}

export const config = createConfig();
