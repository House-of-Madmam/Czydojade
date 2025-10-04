import { apiRequest } from '../apiRequest';
import { ReportIncidentPayload } from '../types/incident';


export const reportIncident = async (payload: ReportIncidentPayload) => {
  return apiRequest('/incidents', {
    method: 'POST',
    body: payload,
    requiresAuth: true,
  });
};