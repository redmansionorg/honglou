import React, { useState } from "react";
import { updateSchema } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SchemaUpdate() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleUpdateSchema = async () => {
        setIsUpdating(true);
        setError(null);
        setResult(null);

        try {
            const { data } = await updateSchema();
            setResult(data);
        } catch (err) {
            console.error("Schema update failed:", err);
            setError(err.data?.error || "更新失败");
        }

        setIsUpdating(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>数据库字段更新</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600">
                            此工具用于为现有的小说记录添加 "is_published" 字段。
                        </p>
                        
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {result && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    {result.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button 
                            onClick={handleUpdateSchema}
                            disabled={isUpdating}
                            className="w-full"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    正在更新...
                                </>
                            ) : (
                                "更新数据库字段"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}