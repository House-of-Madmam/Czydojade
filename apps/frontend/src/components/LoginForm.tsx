'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { loginUser } from '../api/queries/login';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email().max(64),
  password: z.string().min(8).max(64),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await loginUser({ email: values.email, password: values.password });

      navigate('/');
    } catch {
      form.setError('root', {
        message: 'Nieprawidłowy email lub hasło',
      });
    }
  }

  return (
    <div className="px-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="nazwa@domena.pl"
                    className="h-12 bg-gray-900/80 border-gray-700 text-white focus:border-white focus:ring-white/30 placeholder:text-gray-500 backdrop-blur-sm transition-all autofill:bg-gray-900 autofill:text-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300 font-medium" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-white">Hasło</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Hasło"
                      type={showPassword ? 'text' : 'password'}
                      className="h-12 bg-gray-900/80 border-gray-700 text-white focus:border-white focus:ring-white/30 placeholder:text-gray-500 backdrop-blur-sm transition-all autofill:bg-gray-900 autofill:text-white"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-300 font-medium" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 mt-8"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
        </form>
      </Form>
      {form.formState.errors.root && (
        <div className="text-white text-sm mt-4 text-center bg-red-500/20 border border-red-400/60 rounded-lg p-3 backdrop-blur-sm font-medium">
          {form.formState.errors.root.message}
        </div>
      )}
    </div>
  );
}
