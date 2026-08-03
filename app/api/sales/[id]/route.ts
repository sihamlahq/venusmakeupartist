import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth-server";
import { validateSaleUpdate } from "@/lib/sale-utils";
import { createServiceClient } from "@/lib/supabase/server";
import type { SaleUpdateInput } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  const { id } = await context.params;
  const body = (await request.json()) as SaleUpdateInput;

  const validationError = validateSaleUpdate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sales")
    .update({
      client_name: body.client_name.trim(),
      service: body.service.trim(),
      amount: body.amount,
      payment_method: body.payment_method,
      notes: body.notes.trim(),
      sold_at: body.sold_at,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sale: data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing sale id." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sales")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Sale not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
