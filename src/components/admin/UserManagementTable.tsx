
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreHorizontal, ShieldCheck, UserCheck, Crown, ShieldX, UserX } from 'lucide-react';
import { getAllUsers, updateUserProfile } from '@/lib/firestore-users';
import { getUserSubscription, updateUserSubscription } from '@/lib/firestore-subscriptions';
import { getUserProjects } from '@/lib/firestore-projects';
import { getUserLearningPaths } from '@/lib/firestore-learning-paths';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Subscription, Project, LearningPath } from '@/lib/types';

interface EnrichedUser extends UserProfile {
    subscription?: Subscription;
    projectCount?: number;
    learningPathCount?: number;
}

export function UserManagementTable() {
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllUserData = async () => {
    setIsLoading(true);
    try {
      const userProfiles = await getAllUsers();
      const enrichedUsers = await Promise.all(
        userProfiles.map(async (user) => {
          const [subscription, projects, learningPaths] = await Promise.all([
            getUserSubscription(user.uid),
            getUserProjects(user.uid),
            getUserLearningPaths(user.uid),
          ]);
          return {
            ...user,
            subscription,
            projectCount: projects.length,
            learningPathCount: learningPaths.length,
          };
        })
      );
      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUserData();
  }, []);

  const handleUpdateRole = async (userId: string, currentRoles: string[], newRole: 'admin' | 'user') => {
    const isCurrentlyAdmin = currentRoles.includes('admin');
    let updatedRoles: string[];
    
    if (newRole === 'admin' && !isCurrentlyAdmin) {
      updatedRoles = ['user', 'admin'];
    } else if (newRole === 'user' && isCurrentlyAdmin) {
      updatedRoles = ['user'];
    } else {
        return; // No change needed
    }

    try {
        await updateUserProfile(userId, { roles: updatedRoles });
        toast({ title: "Success", description: `User role updated to ${newRole}.` });
        fetchAllUserData();
    } catch (error) {
        console.error("Failed to update user role:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to update user role." });
    }
  };

  const handleUpdateStatus = async (userId: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
     try {
        await updateUserProfile(userId, { status: newStatus });
        toast({ title: "Success", description: `User status updated to ${newStatus}.` });
        fetchAllUserData();
    } catch (error) {
        console.error("Failed to update user status:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to update user status." });
    }
  };
  
  const handleGrantPro = async (userId: string) => {
     try {
        await updateUserSubscription(userId, { status: 'pro', plan: 'pro_tier_granted' });
        toast({ title: "Success", description: "User has been granted Pro access." });
        fetchAllUserData();
    } catch (error) {
        console.error("Failed to grant Pro access:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to grant Pro access." });
    }
  };

  const handleRevokePro = async (userId: string) => {
    try {
        await updateUserSubscription(userId, { status: 'free', plan: 'free_tier_revoked' });
        toast({ title: "Success", description: "User's Pro access has been revoked." });
        fetchAllUserData();
    } catch (error) {
        console.error("Failed to revoke Pro access:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to revoke Pro access." });
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead>Learning Paths</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell>
                <div className="font-medium">{user.email}</div>
                <div className="text-xs text-muted-foreground">Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
              </TableCell>
              <TableCell>
                 <Badge 
                    variant={
                      user.subscription?.status === 'pro' 
                        ? 'default' 
                        : user.subscription?.status === 'trial'
                        ? 'default'
                        : 'secondary'
                    } 
                    className={
                      user.subscription?.status === 'pro' 
                        ? 'bg-green-500/20 text-green-300' 
                        : user.subscription?.status === 'trial'
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300'
                        : ''
                    }
                  >
                    {user.subscription?.status === 'trial' 
                      ? `Trial (${user.subscription.trial_end ? Math.ceil((user.subscription.trial_end - Date.now()) / (24 * 60 * 60 * 1000)) : '?'}d left)`
                      : user.subscription?.status ?? 'free'}
                 </Badge>
              </TableCell>
              <TableCell>
                 <Badge variant={user.roles.includes('admin') ? 'destructive' : 'outline'}>
                    {user.roles.includes('admin') ? 'Admin' : 'User'}
                 </Badge>
              </TableCell>
              <TableCell>
                 <Badge variant={user.status === 'blocked' ? 'destructive' : 'default'} className={user.status === 'blocked' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/10 text-green-400'}>
                    {user.status ?? 'active'}
                 </Badge>
              </TableCell>
              <TableCell>{user.projectCount ?? 0}</TableCell>
              <TableCell>{user.learningPathCount ?? 0}</TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(user.subscription?.status === 'pro' || user.subscription?.status === 'trial') ? (
                            <DropdownMenuItem onClick={() => handleRevokePro(user.uid)}>
                                <Crown className="mr-2 text-destructive"/> Revoke Pro Access
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleGrantPro(user.uid)}>
                                <Crown className="mr-2 text-primary"/> Grant Pro Access
                            </DropdownMenuItem>
                        )}
                        {user.roles.includes('admin') ? (
                            <DropdownMenuItem onClick={() => handleUpdateRole(user.uid, user.roles, 'user')}>
                                <UserCheck className="mr-2"/> Make User
                            </DropdownMenuItem>
                        ) : (
                             <DropdownMenuItem onClick={() => handleUpdateRole(user.uid, user.roles, 'admin')}>
                                <ShieldCheck className="mr-2"/> Make Admin
                            </DropdownMenuItem>
                        )}
                        {user.status === 'blocked' ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user.uid, user.status)}>
                                <UserCheck className="mr-2"/> Unblock User
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user.uid, user.status)}>
                                <UserX className="mr-2"/> Block User
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
