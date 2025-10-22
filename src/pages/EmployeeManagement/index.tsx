import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Calendar,
  UserPlus,
  Settings,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Star,
  Activity,
  Briefcase,
  Timer,
  Trophy
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  productivity: number;
  hoursThisWeek: number;
  goalsCompleted: number;
  totalGoals: number;
  avatar?: string;
  email: string;
  startDate: string;
  lastActive: string;
}



const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Calculate KPIs
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalEmployees = employees.length;
  const avgProductivity = Math.round(
    employees
      .filter(emp => emp.status === 'active')
      .reduce((sum, emp) => sum + emp.productivity, 0) / activeEmployees
  );
  const avgHours = Number(
    (employees
      .filter(emp => emp.status === 'active')
      .reduce((sum, emp) => sum + emp.hoursThisWeek, 0) / activeEmployees
    ).toFixed(1)
  );
  const totalGoalsCompleted = employees.reduce((sum, emp) => sum + emp.goalsCompleted, 0);
  const totalGoals = employees.reduce((sum, emp) => sum + emp.totalGoals, 0);

  const departments = Array.from(new Set(employees.map(emp => emp.department)));

  const filteredEmployees = selectedDepartment === 'all' 
    ? employees 
    : employees.filter(emp => emp.department === selectedDepartment);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on-leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 90) return 'text-green-600';
    if (productivity >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-blue-100 text-blue-800">Launch 1.0 Feature</Badge>
            <Badge className="bg-green-100 text-green-800">Live</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
            <div className="flex items-center pt-1">
              <Badge variant="secondary" className="text-xs">
                {totalEmployees} total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProductivity}%</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
            <div className="flex items-center pt-1">
              <Progress value={avgProductivity} className="w-full h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHours}</div>
            <p className="text-xs text-muted-foreground">
              Per week
            </p>
            <div className="flex items-center pt-1">
              <Badge variant="outline" className="text-xs">
                Standard: 40h
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Met</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoalsCompleted}/{totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
            <div className="flex items-center pt-1">
              <Progress value={(totalGoalsCompleted / totalGoals) * 100} className="w-full h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Department Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {departments.map(dept => {
                  const deptEmployees = employees.filter(emp => emp.department === dept);
                  const activeInDept = deptEmployees.filter(emp => emp.status === 'active').length;
                  const avgProd = Math.round(
                    deptEmployees.reduce((sum, emp) => sum + emp.productivity, 0) / deptEmployees.length
                  );
                  
                  return (
                    <div key={dept} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{dept}</p>
                        <p className="text-sm text-gray-500">{activeInDept}/{deptEmployees.length} active</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getProductivityColor(avgProd)}`}>{avgProd}%</p>
                        <p className="text-sm text-gray-500">Productivity</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 border-l-4 border-l-green-500 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      <p className="font-medium">Mark completed quarterly goals</p>
                      <p className="text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 border-l-4 border-l-blue-500 bg-blue-50 rounded">
                    <Star className="h-4 w-4 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium">Tamara achieved 95% productivity</p>
                      <p className="text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 border-l-4 border-l-yellow-500 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="text-sm">
                      <p className="font-medium">Ahmed is on leave until Monday</p>
                      <p className="text-gray-500">5 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 border-l-4 border-l-green-500 bg-green-50 rounded">
                    <Award className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      <p className="font-medium">Sarah reached perfect attendance</p>
                      <p className="text-gray-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          {/* Department Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedDepartment === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDepartment('all')}
            >
              All Departments
            </Button>
            {departments.map(dept => (
              <Button
                key={dept}
                variant={selectedDepartment === dept ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDepartment(dept)}
              >
                {dept}
              </Button>
            ))}
          </div>

          {/* Employee List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(employee => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {employee.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{employee.name}</h3>
                      <p className="text-xs text-gray-500">{employee.role}</p>
                      <Badge className={`text-xs ${getStatusColor(employee.status)}`}>
                        {employee.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Productivity</span>
                      <span className={`text-xs font-semibold ${getProductivityColor(employee.productivity)}`}>
                        {employee.productivity}%
                      </span>
                    </div>
                    <Progress value={employee.productivity} className="h-2" />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Hours: {employee.hoursThisWeek}h</span>
                      <span>Goals: {employee.goalsCompleted}/{employee.totalGoals}</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Last active: {employee.lastActive}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees
                    .filter(emp => emp.status === 'active')
                    .sort((a, b) => b.productivity - a.productivity)
                    .slice(0, 5)
                    .map((emp, index) => (
                      <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-green-600">{emp.productivity}%</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Goal Achievement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Goal Achievement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees
                    .filter(emp => emp.status === 'active')
                    .sort((a, b) => (b.goalsCompleted / b.totalGoals) - (a.goalsCompleted / a.totalGoals))
                    .slice(0, 5)
                    .map(emp => {
                      const percentage = Math.round((emp.goalsCompleted / emp.totalGoals) * 100);
                      return (
                        <div key={emp.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{emp.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{emp.name}</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {emp.goalsCompleted}/{emp.totalGoals}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="flex-1 h-2" />
                            <span className="text-xs text-gray-500 w-10">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Productivity Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Analytics charts will be implemented here</p>
                    <p className="text-sm">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 border rounded-lg">
                  <Timer className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{avgHours}h</p>
                  <p className="text-sm text-gray-500">Avg Hours/Week</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{avgProductivity}%</p>
                  <p className="text-sm text-gray-500">Team Productivity</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{Math.round((totalGoalsCompleted / totalGoals) * 100)}%</p>
                  <p className="text-sm text-gray-500">Goals Achievement</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeManagement;
