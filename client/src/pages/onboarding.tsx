import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const personalInfoSchema = z.object({
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.string().min(1, "Gender is required"),
  favoriteTeam: z.string().min(1, "Favorite team is required"),
  favoriteDriver: z.string().min(1, "Favorite driver is required"),
});

const profileSetupSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers")
    .transform(val => val.toLowerCase()),
});

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoForm | null>(null);
  const [usernameValue, setUsernameValue] = useState<string>("");
  const [usernameCheck, setUsernameCheck] = useState<string>("");
  const [usernameDebounce, setUsernameDebounce] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce username checking
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsernameDebounce(usernameCheck);
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameCheck]);



  // Check username availability
  const { data: isUsernameAvailable, isLoading: checkingUsername } = useQuery({
    queryKey: ["/api/users/check-username", usernameDebounce],
    enabled: usernameDebounce.length >= 3 && /^[a-zA-Z0-9]+$/.test(usernameDebounce),
    queryFn: async () => {
      const response = await fetch(`/api/users/check-username?username=${usernameDebounce.toLowerCase()}`);
      if (!response.ok) throw new Error("Failed to check username");
      const data = await response.json();
      return data.available;
    },
    retry: false,
  });

  const personalInfoForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      birthDate: "",
      gender: "",
      favoriteTeam: "",
      favoriteDriver: "",
    },
  });

  const profileSetupForm = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: "",
    },
    mode: "onChange",
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onPersonalInfoSubmit = (data: PersonalInfoForm) => {
    setPersonalInfo(data);
    // Clear username state when moving to step 2
    setUsernameValue("");
    setUsernameCheck("");
    setUsernameDebounce("");
    setStep(2);
  };

  const onProfileSetupSubmit = () => {
    if (!personalInfo) return;

    // Validate username
    if (!usernameValue || usernameValue.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    // Check if username is available before submitting
    if (usernameDebounce.toLowerCase() !== usernameValue.toLowerCase() || !isUsernameAvailable) {
      toast({
        title: "Error",
        description: "Please wait for username validation or choose a different username",
        variant: "destructive",
      });
      return;
    }

    updateUserMutation.mutate({
      ...personalInfo,
      username: usernameValue,
      isOnboardingComplete: true,
    });
  };

  const teams = [
    "Red Bull Racing",
    "Ferrari", 
    "Mercedes",
    "McLaren",
    "Aston Martin",
    "Alpine",
    "Williams",
    "Racing Bulls",
    "Sauber",
    "Haas",
    "Cadillac",
  ];

  const drivers = [
    "Alex Albon",
    "Carlos Sainz",
    "Charles Leclerc",
    "Esteban Ocon",
    "Fernando Alonso",
    "Franco Colapinto",
    "Gabriel Bortoleto",
    "George Russell",
    "Isack Hadjar",
    "Jack Doohan",
    "Kimi Antonelli",
    "Lance Stroll",
    "Lando Norris",
    "Lewis Hamilton",
    "Liam Lawson",
    "Max Verstappen",
    "Nico Hulkenberg",
    "Ollie Bearman",
    "Oscar Piastri",
    "Pierre Gasly",
    "Yuki Tsunoda",
  ];

  if (step === 1) {
    return (
      <div className="min-h-screen bg-deep-dark flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <Flag className="text-racing-red text-4xl mb-4 mx-auto" />
            <h2 className="text-3xl font-bold mb-2 text-white">Tell us about yourself</h2>
            <p className="text-gray-400">Help us personalize your F1 experience</p>
          </div>

          <Card className="bg-card-dark border-gray-700">
            <CardContent className="pt-6">
              <Form {...personalInfoForm}>
                <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                  <FormField
                    control={personalInfoForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">When were you born?</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="bg-deep-dark border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">What is your gender?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-deep-dark border-gray-600 text-white">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card-dark border-gray-600">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="nonbinary">Nonbinary</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="favoriteTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">What is your favorite F1 team?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-deep-dark border-gray-600 text-white">
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card-dark border-gray-600">
                            {teams.map((team) => (
                              <SelectItem key={team} value={team}>
                                {team}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalInfoForm.control}
                    name="favoriteDriver"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Who is your favorite F1 driver?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-deep-dark border-gray-600 text-white">
                              <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card-dark border-gray-600">
                            {drivers.map((driver) => (
                              <SelectItem key={driver} value={driver}>
                                {driver}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-racing-red hover:bg-red-700 text-white"
                  >
                    Continue
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-dark flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-card-dark rounded-full mx-auto mb-4 flex items-center justify-center">
            <Flag className="text-racing-red text-2xl" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">Set up your profile</h2>
          <p className="text-gray-400">Create your unique presence on boxboxd</p>
        </div>

        <Card className="bg-card-dark border-gray-700">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Username</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder=""
                    value={usernameValue}
                    className="bg-deep-dark border-gray-600 text-white pr-10"
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const cleanValue = rawValue.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
                      setUsernameValue(cleanValue);
                      setUsernameCheck(cleanValue);
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  {usernameDebounce && usernameDebounce.length >= 3 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingUsername ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : isUsernameAvailable ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-gray-400">Letters and numbers only, will be converted to lowercase</p>
                  {usernameDebounce && usernameDebounce.length >= 3 && !checkingUsername && (
                    <p className={`text-xs ${isUsernameAvailable ? 'text-green-500' : 'text-red-500'}`}>
                      {isUsernameAvailable ? '✓ Username available' : '✗ Username taken'}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={onProfileSetupSubmit}
                disabled={
                  updateUserMutation.isPending || 
                  !usernameValue || 
                  usernameValue.length < 3 || 
                  checkingUsername || 
                  !isUsernameAvailable
                }
                className="w-full bg-racing-red hover:bg-red-700 text-white disabled:opacity-50"
              >
                {updateUserMutation.isPending ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
