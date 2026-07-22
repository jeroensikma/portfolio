"use client";

import { useState } from "react";
import { Button, TextField } from "@/components";

interface ChangePasswordOverlayProps {
    onSave: (newPassword: string) => Promise<string | null>;
    onCancel: () => void;
}

export default function ChangePasswordOverlay({
    onSave,
    onCancel,
}: ChangePasswordOverlayProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setError(null);

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setSaving(true);
        const err = await onSave(newPassword);
        if (err) {
            setError(err);
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-[rgba(217,217,217,0.4)] backdrop-blur-[3.65px]"
                onClick={onCancel}
            />

            <div className="relative bg-white w-[680px] px-lg py-xl flex flex-col gap-[24px]">
                <p className="text-black uppercase">
                    Change password
                </p>

                <div className="flex flex-col gap-sm w-full">
                    <p className="text-black">New password</p>
                    <TextField
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="Enter new password"
                        type="password"
                    />
                </div>

                <div className="flex flex-col gap-sm w-full">
                    <p className="text-black">Confirm password</p>
                    <TextField
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Confirm new password"
                        type="password"
                    />
                </div>

                {error && (
                    <p className="text-red">{error}</p>
                )}

                <div className="flex flex-col gap-xs w-full">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                    >
                        {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
