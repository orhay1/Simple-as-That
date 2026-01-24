import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function AccountTab() {
  const { user, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const email = user?.email || '';
  const createdAt = user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '';

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success(t.settingsAccount.deleteSuccess);
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(t.settingsAccount.deleteFailed);
      setIsDeleting(false);
    }
  };

  const isConfirmValid = confirmText === 'DELETE';

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.settingsAccount.title}
          </CardTitle>
          <CardDescription>{t.settingsAccount.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t.settingsAccount.email}</Label>
              <p className="font-medium">{email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t.settingsAccount.displayName}</Label>
              <p className="font-medium">{displayName || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t.settingsAccount.memberSince}</Label>
              <p className="font-medium">{createdAt}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t.settingsAccount.dangerZone}
          </CardTitle>
          <CardDescription>{t.settingsAccount.dangerDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="me-2 h-4 w-4" />
                {t.settingsAccount.deleteAccount}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {t.settingsAccount.deleteTitle}
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>{t.settingsAccount.deleteWarning}</p>
                  <ul className="list-disc ps-6 space-y-1 text-sm">
                    <li>{t.settingsAccount.deleteItem1}</li>
                    <li>{t.settingsAccount.deleteItem2}</li>
                    <li>{t.settingsAccount.deleteItem3}</li>
                    <li>{t.settingsAccount.deleteItem4}</li>
                  </ul>
                  <div className="pt-4 space-y-2">
                    <Label htmlFor="confirm-delete">{t.settingsAccount.typeDelete}</Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="font-mono"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>
                  {t.common.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={!isConfirmValid || isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {t.settingsAccount.deleting}
                    </>
                  ) : (
                    t.settingsAccount.deleteAccount
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
