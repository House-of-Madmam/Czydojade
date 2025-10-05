import { apiRequest } from '../apiRequest';
import { ReportIncidentPayload } from '../types/incident';

export const reportIncident = async (payload: ReportIncidentPayload) => {
  console.log('reportIncident', payload);
  return apiRequest('/incidents', {
    method: 'POST',
    body: payload,
    requiresAuth: true,
  });
};
