'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { reportIncident } from '@/api/queries/reportIncident';
import { useState } from 'react';
import { z } from 'zod';
import { IncidentPriority, IncidentType } from '@/api/types/incident';
import BinaryToggleGroup from './ui/BinaryToggleGroup';
import GeolocationStatus from './GeolocationStatus';
import { store } from '@/store';
import StopPicker from './StopPicker';
import LinePicker from './LinePicker';
import { Line } from '@/api/queries/getLines';

const formSchema = z
  .object({
    description: z.string().max(1000).optional(),
    type: z.nativeEnum(IncidentType),
    priority: z.nativeEnum(IncidentPriority),
    stopId: z.string().optional(),
    lineId: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    lineDirection: z.string().optional(),
  })
  .refine((data) => data.stopId !== '' || data.lineId !== '', {
    message: 'Incident location must be specified',
    path: ['stopId', 'lineId'],
  });

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function IncidentForm({ open = false, onOpenChange, onSuccess }: Props) {
  const [useLocation, setUseLocation] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false); // Track submission success
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      description: '',
      type: IncidentType.VehicleBreakdown,
      priority: IncidentPriority.Medium,
      stopId: '',
      lineId: '',
      latitude: '',
      longitude: '',
      lineDirection: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const { latitude, longitude } = store.getState().geolocation;
      if (useLocation && latitude !== null && longitude !== null) {
        values.latitude = latitude.toString();
        values.longitude = longitude.toString();
        values.stopId = undefined;
      } else {
        values.lineId = undefined;
      }
      const sanitizedValues = {
        ...values,
        description: values.description || undefined,
        stopId: values.stopId || undefined,
        lineId: values.lineId || undefined,
        latitude: values.latitude || undefined,
        longitude: values.longitude || undefined,
      };

      await reportIncident(sanitizedValues);

      setIsSubmitted(true); // Mark as submitted
      onSuccess?.();

      // Zamknij modal po 2 sekundach
      setTimeout(() => {
        onOpenChange?.(false);
        setIsSubmitted(false);
        form.reset();
      }, 2000);
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Registration error',
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-gray-800 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Zgłoś wypadek</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <BinaryToggleGroup
              options={[
                { label: 'Wybierz linię', value: 'location' },
                { label: 'Wybierz przystanek', value: 'stop' },
              ]}
              value={useLocation ? 'location' : 'stop'}
              onValueChange={(event) => setUseLocation(event.target.value === 'location')}
            />
            {useLocation ? (
              <>
                <FormField
                  control={form.control}
                  name="lineId"
                  render={({ field }) => (
                    <>
                      <GeolocationStatus />
                      <FormItem>
                        <FormLabel className="text-white">Linia</FormLabel>
                        <FormControl>
                          <LinePicker
                            onSelect={(line) => {
                              setSelectedLine(line);
                              field.onChange(line?.id || '');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
                {!selectedLine || !selectedLine.directions || selectedLine.directions.length === 0 ? null : (
                  <FormField
                    control={form.control}
                    name="lineDirection"
                    render={({ field }) => (
                      <>
                        <FormItem>
                          <FormLabel className="text-white">Kierunek</FormLabel>
                          <FormControl>
                            <select
                              className="w-full bg-gray-900/50 border-gray-700 text-white rounded-lg p-2 focus:border-white focus:ring-white/20"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <option
                                value=""
                                disabled
                              >
                                Wybierz kierunek
                              </option>
                              {selectedLine.directions.map((direction) => (
                                <option
                                  key={direction}
                                  value={direction}
                                >
                                  {direction}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </>
                    )}
                  />
                )}
              </>
            ) : (
              <FormField
                control={form.control}
                name="stopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Przystanek</FormLabel>
                    <FormControl>
                      <StopPicker
                        onSelect={(stop) => field.onChange(stop?.id || '')}
                        radiusMeters={300}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Typ incydentu</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {[
                        { value: 'vehicleBreakdown', label: 'Awaria pojazdu' },
                        { value: 'infrastructureBreakdown', label: 'Awaria infrastruktury' },
                        { value: 'dangerInsideVehicle', label: 'Niebezpieczeństwo w pojeździe' },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-800/30 p-2 rounded-lg transition-colors"
                        >
                          <input
                            type="radio"
                            value={option.value}
                            checked={field.value === option.value}
                            onChange={() => field.onChange(option.value)}
                            className="w-4 h-4 text-white bg-gray-800 border-gray-600 focus:ring-white focus:ring-2"
                          />
                          <span className="text-white text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {['low', 'medium', 'high', 'critical'].map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Opis</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Opisz incydent"
                      className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-white focus:ring-white/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 bg-white hover:bg-gray-100 text-black disabled:bg-gray-300 disabled:text-gray-500 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mt-6 border-0 rounded-lg transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={!form.formState.isValid || form.formState.isSubmitting || isSubmitted} // Disable after submission
            >
              {form.formState.isSubmitting ? 'Wysyłanie...' : 'Zgłoś wypadek'}
            </Button>
          </form>
        </Form>
        {isSubmitted && (
          <div className="text-green-300 text-sm mt-3 text-center bg-gray-900/50 border border-gray-700 rounded-lg p-3 backdrop-blur-sm">
            Dziękujemy za zgłoszenie!
          </div>
        )}
        {form.formState.errors.root && (
          <div className="text-red-300 text-sm mt-3 text-center bg-gray-900/50 border border-gray-700 rounded-lg p-3 backdrop-blur-sm">
            {form.formState.errors.root.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
