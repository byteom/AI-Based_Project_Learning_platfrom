"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getPricingConfig, updatePricingConfig, createPricingConfig } from "@/lib/firestore-pricing";
import type { PricingConfig } from "@/lib/types";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PricingManagement() {
  const [pricingPlans, setPricingPlans] = useState<PricingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPlan, setEditedPlan] = useState<Partial<PricingConfig> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setIsLoading(true);
    try {
      const configs = await getPricingConfig();
      setPricingPlans(configs);
    } catch (error) {
      console.error("Failed to load pricing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pricing configuration.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (plan: PricingConfig) => {
    setEditingId(plan.id);
    setEditedPlan({ ...plan });
  };

  const handleSave = async (id: string) => {
    if (!editedPlan) return;
    
    setIsSaving(true);
    try {
      await updatePricingConfig(id, editedPlan);
      await loadPricing();
      setEditingId(null);
      setEditedPlan(null);
      toast({
        title: "Success",
        description: "Pricing updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update pricing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update pricing configuration.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedPlan(null);
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (!editedPlan) return;
    const features = [...(editedPlan.features || [])];
    features[index] = value;
    setEditedPlan({ ...editedPlan, features });
  };

  const handleAddFeature = () => {
    if (!editedPlan) return;
    const features = [...(editedPlan.features || []), ""];
    setEditedPlan({ ...editedPlan, features });
  };

  const handleRemoveFeature = (index: number) => {
    if (!editedPlan) return;
    const features = editedPlan.features?.filter((_, i) => i !== index) || [];
    setEditedPlan({ ...editedPlan, features });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-headline">Pricing Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage subscription plans and pricing for your platform.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          Changes to pricing will affect new subscriptions. Existing subscriptions will continue with their current pricing until renewal.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pricingPlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.planName}
                {editingId === plan.id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(plan.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                    Edit
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {editingId === plan.id ? (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Plan Name</Label>
                      <Input
                        value={editedPlan?.planName || ""}
                        onChange={(e) => setEditedPlan({ ...editedPlan, planName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={editedPlan?.price || 0}
                          onChange={(e) => setEditedPlan({ ...editedPlan, price: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={editedPlan?.currency || "USD"}
                          onValueChange={(value) => setEditedPlan({ ...editedPlan, currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Interval</Label>
                      <Select
                        value={editedPlan?.interval || "monthly"}
                        onValueChange={(value: 'monthly' | 'yearly') => setEditedPlan({ ...editedPlan, interval: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Active</Label>
                        <Switch
                          checked={editedPlan?.isActive ?? true}
                          onCheckedChange={(checked) => setEditedPlan({ ...editedPlan, isActive: checked })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Features</Label>
                      {editedPlan?.features?.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            placeholder="Feature description"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFeature(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={handleAddFeature}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Feature
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold mt-2">
                      {plan.currency === 'USD' && '$'}
                      {plan.currency === 'INR' && '₹'}
                      {plan.currency === 'EUR' && '€'}
                      {plan.currency === 'GBP' && '£'}
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${plan.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingId !== plan.id && (
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

