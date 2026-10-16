import { useState } from 'react';
import { useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import {
  useGenerate2FASecretQuery,
  useEnable2FAMutation,
  useDisable2FAMutation,
  useGetBackupCodesQuery,
  useRegenerateBackupCodesMutation,
} from '../slices/usersApiSlice';
import Button from './Button';

const TwoFactorSetup = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [step, setStep] = useState('menu');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  const { data: secretData, isLoading: secretLoading } = useGenerate2FASecretQuery(undefined, {
    skip: step !== 'scan',
  });
  const [enable2FA, { isLoading: enabling }] = useEnable2FAMutation();
  const [disable2FA, { isLoading: disabling }] = useDisable2FAMutation();
  const { data: backupData } = useGetBackupCodesQuery(undefined, { skip: !userInfo?.token });
  const [regenerateCodes, { isLoading: regenerating }] = useRegenerateBackupCodesMutation();

  const handleEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      return toast.error('Please enter a 6-digit verification code');
    }
    try {
      const result = await enable2FA({
        secret: secretData.secret,
        token: verificationCode,
      }).unwrap();
      setBackupCodes(result.backupCodes);
      setShowBackupCodes(true);
      setStep('backup');
      toast.success('2FA enabled successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleDisable = async () => {
    if (!disablePassword) return toast.error('Password is required');
    try {
      await disable2FA({ password: disablePassword }).unwrap();
      setStep('menu');
      setDisablePassword('');
      toast.success('2FA disabled successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handleRegenerate = async () => {
    try {
      const result = await regenerateCodes({ password: disablePassword }).unwrap();
      setBackupCodes(result.backupCodes);
      toast.success('Backup codes regenerated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to regenerate codes');
    }
  };

  const isEnabled = userInfo?.twoFactorEnabled;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg mx-auto">
      <h2 className="text-lg font-black text-gray-900 mb-2">Two-Factor Authentication</h2>
      <p className="text-sm text-gray-500 mb-6">Add an extra layer of security to your account using TOTP authenticator apps like Google Authenticator or Authy.</p>

      {step === 'menu' && (
        <div className="space-y-4">
          {isEnabled ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-bold text-green-800">2FA is currently enabled</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Backup Codes</h3>
                <p className="text-xs text-gray-500">
                  {backupData?.usedCount || 0} of {backupData?.totalCount || 0} used
                  {backupData?.backupCodes?.length > 0 && ` — ${backupData.backupCodes.length} remaining`}
                </p>
                {backupData?.backupCodes?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {backupData.backupCodes.map((code, i) => (
                      <code key={i} className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-center">
                        {code}
                      </code>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-900">Disable 2FA</h3>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    onClick={handleDisable}
                    disabled={disabling}
                  >
                    {disabling ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    {regenerating ? 'Regenerating...' : 'Regenerate Codes'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <Button
                variant="primary"
                size="full"
                onClick={() => setStep('scan')}
                disabled={secretLoading}
              >
                {secretLoading ? 'Preparing...' : 'Enable Two-Factor Authentication'}
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 'scan' && secretData && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <QRCodeSVG value={secretData.qrCode} size={200} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Or enter this code manually in your authenticator app:</p>
            <code className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg text-gray-900 select-all">
              {secretData.secret}
            </code>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-900 block">Enter the 6-digit code from your authenticator app:</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <Button
              variant="primary"
              size="full"
              onClick={handleEnable}
              disabled={enabling || verificationCode.length !== 6}
            >
              {enabling ? 'Verifying...' : 'Verify & Enable'}
            </Button>
            <button
              onClick={() => setStep('menu')}
              className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border-0 bg-transparent cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-yellow-800 mb-2">Save These Backup Codes</h3>
            <p className="text-xs text-yellow-700 mb-3">
              Each code can be used only once. Store them somewhere safe — you won't be able to see them again.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="text-xs font-mono bg-white px-2 py-1.5 rounded border border-yellow-300 text-center select-all">
                  {code}
                </code>
              ))}
            </div>
          </div>
          <Button
            variant="secondary"
            size="full"
            onClick={() => { setStep('menu'); setShowBackupCodes(false); }}
          >
            I've Saved My Codes
          </Button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
