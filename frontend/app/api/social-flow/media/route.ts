// Upload e gestão de mídia
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

const supabase = createServiceClient()

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") ?? "default"
    const folder = req.nextUrl.searchParams.get("folder")

    let query = supabase
      .from("media_library")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false })

    if (folder && folder !== "all") query = query.eq("folder", folder)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ media: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = (formData.get("user_id") as string) ?? "default"
    const folder = (formData.get("folder") as string) ?? "general"

    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })

    // Upload para Supabase Storage
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `social-flow/${userId}/${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath)

    // Salvar na media_library
    const { data, error } = await supabase
      .from("media_library")
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_type: file.type.startsWith("video") ? "video" : "image",
        file_size: file.size,
        mime_type: file.type,
        folder,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ media: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    // Soft delete
    const { error } = await supabase
      .from("media_library")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 500 })
  }
}
