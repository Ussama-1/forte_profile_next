import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function Settings() {
  return (
    <>
      {/* Main Content Card */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 bg-[#274754] text-white">
            <h2 className="text-xl font-bold mb-2">SETTINGS</h2>
            <p className="text-sm text-slate-300">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>

              {/* Account Settings */}
              <TabsContent value="account" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Account Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="admin@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue="admin_user" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline">Cancel</Button>
                  <Button style={{ backgroundColor: "#0d9488" }}>Save Changes</Button>
                </div>
              </TabsContent>

              {/* Profile Settings */}
              <TabsContent value="profile" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" defaultValue="Admin" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" defaultValue="User" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" placeholder="City, State" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Professional Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="job-title">Current Job Title</Label>
                      <Input id="job-title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company/Organization</Label>
                      <Input id="company" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select>
                        <SelectTrigger id="industry">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Select>
                        <SelectTrigger id="experience">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-2">0-2 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="6-10">6-10 years</SelectItem>
                          <SelectItem value="11-15">11-15 years</SelectItem>
                          <SelectItem value="16+">16+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline">Cancel</Button>
                  <Button style={{ backgroundColor: "#0d9488" }}>Save Changes</Button>
                </div>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Job Matches</p>
                        <p className="text-sm text-slate-500">Receive notifications for new job matches</p>
                      </div>
                      <Switch id="job-matches" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Profile Updates</p>
                        <p className="text-sm text-slate-500">Receive notifications when your profile is updated</p>
                      </div>
                      <Switch id="profile-updates" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Digest</p>
                        <p className="text-sm text-slate-500">Receive a weekly summary of your job search activity</p>
                      </div>
                      <Switch id="weekly-digest" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing Communications</p>
                        <p className="text-sm text-slate-500">Receive updates about new features and promotions</p>
                      </div>
                      <Switch id="marketing" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Notification Frequency</h3>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Email Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline">Cancel</Button>
                  <Button style={{ backgroundColor: "#0d9488" }}>Save Changes</Button>
                </div>
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Theme</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="border rounded-lg p-4 cursor-pointer bg-white">
                      <div className="h-20 bg-slate-50 rounded mb-2 border"></div>
                      <p className="font-medium text-center">Light</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer bg-slate-900 text-white">
                      <div className="h-20 bg-[#274754] rounded mb-2 border border-slate-700"></div>
                      <p className="font-medium text-center">Dark</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer bg-gradient-to-r from-slate-50 to-slate-900">
                      <div className="h-20 bg-gradient-to-r from-white to-[#274754] rounded mb-2 border"></div>
                      <p className="font-medium text-center">System</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Accent Color</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="border rounded-lg p-4 cursor-pointer">
                      <div className="h-12 bg-teal-600 rounded mb-2"></div>
                      <p className="font-medium text-center">Teal (Default)</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer">
                      <div className="h-12 bg-blue-600 rounded mb-2"></div>
                      <p className="font-medium text-center">Blue</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer">
                      <div className="h-12 bg-purple-600 rounded mb-2"></div>
                      <p className="font-medium text-center">Purple</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer">
                      <div className="h-12 bg-amber-600 rounded mb-2"></div>
                      <p className="font-medium text-center">Amber</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Display Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Compact Mode</p>
                        <p className="text-sm text-slate-500">Reduce spacing and padding in the interface</p>
                      </div>
                      <Switch id="compact-mode" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Animations</p>
                        <p className="text-sm text-slate-500">Enable interface animations and transitions</p>
                      </div>
                      <Switch id="animations" defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline">Cancel</Button>
                  <Button style={{ backgroundColor: "#0d9488" }}>Save Changes</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
