"use client";

import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required (e.g., '15 Litre Jar')"),
  price: z.coerce.number().min(0, "Price must be positive"),
  active: z.boolean().default(true),
});

export default function ProductsPage() {
  const { data: products, isLoading } = useListProducts();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "Groundnut Oil", unit: "", price: 0, active: true }
  });

  const openEdit = (product: any) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      unit: product.unit,
      price: product.price,
      active: product.active
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    form.reset({ name: "Groundnut Oil", unit: "", price: 0, active: true });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            setIsDialogOpen(false);
            toast({ title: "Product updated successfully" });
          }
        }
      );
    } else {
      createProduct.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            setIsDialogOpen(false);
            toast({ title: "Product created successfully" });
          }
        }
      );
    }
  };

  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const toggleActive = (id: number, active: boolean) => {
    updateProduct.mutate(
      { id, data: { active } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() })
      }
    );
  };

  const confirmDeleteProduct = () => {
    if (!deletingProductId) return;
    deleteProduct.mutate(
      { id: deletingProductId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product deleted", variant: "success" });
          setDeletingProductId(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Package}
        title="Products & Pricing"
        description="Manage your catalogue items, packaging variants, and prices."
        breadcrumbs={[{ label: "Products" }]}
        actions={
          <Button onClick={openCreate} className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        }
      />
        
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packaging / Unit</FormLabel>
                      <FormControl><Input placeholder="e.g. 15 KG Tin" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <p className="text-sm text-muted-foreground">Inactive products won't be offered in auto-replies.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/3 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : products?.map((product) => (
          <Card key={product.id} className={!product.active ? "opacity-60 grayscale-[0.5]" : ""}>
            <CardHeader className="pb-2 relative">
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <Switch 
                  checked={product.active} 
                  onCheckedChange={(c) => toggleActive(product.id, c)}
                  aria-label="Toggle active status"
                />
              </div>
              <CardTitle className="text-lg pr-12">{product.name}</CardTitle>
              <CardDescription>{product.unit}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-3xl font-bold text-primary">
                  ₹{product.price.toLocaleString('en-IN')}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeletingProductId(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!product.active && (
                <Badge variant="secondary" className="mt-4">Inactive</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deletingProductId}
        onOpenChange={(open) => !open && setDeletingProductId(null)}
        title="Delete Product?"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
        variant="destructive"
        loading={deleteProduct.isPending}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
}
