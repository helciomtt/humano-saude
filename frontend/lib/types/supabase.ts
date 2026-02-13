// =============================================
// 📦 HUMANO SAÚDE — SUPABASE DATABASE TYPES
// =============================================
// Interface tipada para o Supabase Client.
// Cobre todas as tabelas CRM do projeto.
// Sincronizado com:
//   - 20260211_create_crm_tables.sql
//   - 20260213_create_crm_advanced.sql
//   - 20260213_crm_detail_panel_tables.sql
// =============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ==============================
      // CRM — Pipelines
      // ==============================
      crm_pipelines: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          posicao: number;
          is_default: boolean;
          is_active: boolean;
          cor: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          posicao?: number;
          is_default?: boolean;
          is_active?: boolean;
          cor?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          posicao?: number;
          is_default?: boolean;
          is_active?: boolean;
          cor?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Stages
      // ==============================
      crm_stages: {
        Row: {
          id: string;
          pipeline_id: string;
          nome: string;
          slug: string;
          posicao: number;
          cor: string;
          icone: string | null;
          probabilidade: number;
          is_won: boolean;
          is_lost: boolean;
          auto_move_days: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pipeline_id: string;
          nome: string;
          slug?: string;
          posicao?: number;
          cor?: string;
          icone?: string | null;
          probabilidade?: number;
          is_won?: boolean;
          is_lost?: boolean;
          auto_move_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pipeline_id?: string;
          nome?: string;
          slug?: string;
          posicao?: number;
          cor?: string;
          icone?: string | null;
          probabilidade?: number;
          is_won?: boolean;
          is_lost?: boolean;
          auto_move_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Companies
      // ==============================
      crm_companies: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          razao_social: string | null;
          dominio: string | null;
          setor: string | null;
          porte: string | null;
          qtd_funcionarios: number | null;
          faturamento_anual: number | null;
          telefone: string | null;
          email: string | null;
          endereco: Json;
          logo_url: string | null;
          tags: string[];
          custom_fields: Json;
          owner_corretor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cnpj?: string | null;
          razao_social?: string | null;
          dominio?: string | null;
          setor?: string | null;
          porte?: string | null;
          qtd_funcionarios?: number | null;
          faturamento_anual?: number | null;
          telefone?: string | null;
          email?: string | null;
          endereco?: Json;
          logo_url?: string | null;
          tags?: string[];
          custom_fields?: Json;
          owner_corretor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cnpj?: string | null;
          razao_social?: string | null;
          dominio?: string | null;
          setor?: string | null;
          porte?: string | null;
          qtd_funcionarios?: number | null;
          faturamento_anual?: number | null;
          telefone?: string | null;
          email?: string | null;
          endereco?: Json;
          logo_url?: string | null;
          tags?: string[];
          custom_fields?: Json;
          owner_corretor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Contacts
      // ==============================
      crm_contacts: {
        Row: {
          id: string;
          company_id: string | null;
          lead_id: string | null;
          owner_corretor_id: string | null;
          nome: string;
          sobrenome: string | null;
          email: string | null;
          telefone: string | null;
          whatsapp: string | null;
          cpf: string | null;
          data_nascimento: string | null;
          cargo: string | null;
          lifecycle_stage: string;
          lead_source: string | null;
          score: number;
          score_motivo: string | null;
          ultimo_contato: string | null;
          total_atividades: number;
          avatar_url: string | null;
          tags: string[];
          custom_fields: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          lead_id?: string | null;
          owner_corretor_id?: string | null;
          nome: string;
          sobrenome?: string | null;
          email?: string | null;
          telefone?: string | null;
          whatsapp?: string | null;
          cpf?: string | null;
          data_nascimento?: string | null;
          cargo?: string | null;
          lifecycle_stage?: string;
          lead_source?: string | null;
          score?: number;
          score_motivo?: string | null;
          ultimo_contato?: string | null;
          total_atividades?: number;
          avatar_url?: string | null;
          tags?: string[];
          custom_fields?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          lead_id?: string | null;
          owner_corretor_id?: string | null;
          nome?: string;
          sobrenome?: string | null;
          email?: string | null;
          telefone?: string | null;
          whatsapp?: string | null;
          cpf?: string | null;
          data_nascimento?: string | null;
          cargo?: string | null;
          lifecycle_stage?: string;
          lead_source?: string | null;
          score?: number;
          score_motivo?: string | null;
          ultimo_contato?: string | null;
          total_atividades?: number;
          avatar_url?: string | null;
          tags?: string[];
          custom_fields?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Deals
      // ==============================
      crm_deals: {
        Row: {
          id: string;
          pipeline_id: string;
          stage_id: string;
          contact_id: string | null;
          company_id: string | null;
          owner_corretor_id: string | null;
          crm_card_id: string | null;
          lead_id: string | null;
          titulo: string;
          valor: number | null;
          valor_recorrente: number | null;
          moeda: string;
          data_previsao_fechamento: string | null;
          data_ganho: string | null;
          data_perda: string | null;
          probabilidade: number | null;
          posicao: number;
          motivo_perda: string | null;
          motivo_perda_detalhe: string | null;
          score: number;
          prioridade: string;
          is_hot: boolean;
          is_stale: boolean;
          dias_no_stage: number;
          tags: string[];
          custom_fields: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pipeline_id: string;
          stage_id: string;
          contact_id?: string | null;
          company_id?: string | null;
          owner_corretor_id?: string | null;
          crm_card_id?: string | null;
          lead_id?: string | null;
          titulo: string;
          valor?: number | null;
          valor_recorrente?: number | null;
          moeda?: string;
          data_previsao_fechamento?: string | null;
          data_ganho?: string | null;
          data_perda?: string | null;
          probabilidade?: number | null;
          posicao?: number;
          motivo_perda?: string | null;
          motivo_perda_detalhe?: string | null;
          score?: number;
          prioridade?: string;
          is_hot?: boolean;
          is_stale?: boolean;
          dias_no_stage?: number;
          tags?: string[];
          custom_fields?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pipeline_id?: string;
          stage_id?: string;
          contact_id?: string | null;
          company_id?: string | null;
          owner_corretor_id?: string | null;
          crm_card_id?: string | null;
          lead_id?: string | null;
          titulo?: string;
          valor?: number | null;
          valor_recorrente?: number | null;
          moeda?: string;
          data_previsao_fechamento?: string | null;
          data_ganho?: string | null;
          data_perda?: string | null;
          probabilidade?: number | null;
          posicao?: number;
          motivo_perda?: string | null;
          motivo_perda_detalhe?: string | null;
          score?: number;
          prioridade?: string;
          is_hot?: boolean;
          is_stale?: boolean;
          dias_no_stage?: number;
          tags?: string[];
          custom_fields?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Activities
      // ==============================
      crm_activities: {
        Row: {
          id: string;
          deal_id: string | null;
          contact_id: string | null;
          company_id: string | null;
          owner_corretor_id: string | null;
          tipo: string;
          assunto: string | null;
          descricao: string | null;
          concluida: boolean;
          data_vencimento: string | null;
          data_conclusao: string | null;
          duracao_minutos: number | null;
          anexo_url: string | null;
          anexo_tipo: string | null;
          resultado: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          owner_corretor_id?: string | null;
          tipo: string;
          assunto?: string | null;
          descricao?: string | null;
          concluida?: boolean;
          data_vencimento?: string | null;
          data_conclusao?: string | null;
          duracao_minutos?: number | null;
          anexo_url?: string | null;
          anexo_tipo?: string | null;
          resultado?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          owner_corretor_id?: string | null;
          tipo?: string;
          assunto?: string | null;
          descricao?: string | null;
          concluida?: boolean;
          data_vencimento?: string | null;
          data_conclusao?: string | null;
          duracao_minutos?: number | null;
          anexo_url?: string | null;
          anexo_tipo?: string | null;
          resultado?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };

      // ==============================
      // CRM — Products
      // ==============================
      crm_products: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          codigo: string | null;
          operadora_id: string | null;
          preco: number;
          preco_recorrente: number | null;
          moeda: string;
          categoria: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          codigo?: string | null;
          operadora_id?: string | null;
          preco: number;
          preco_recorrente?: number | null;
          moeda?: string;
          categoria?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          codigo?: string | null;
          operadora_id?: string | null;
          preco?: number;
          preco_recorrente?: number | null;
          moeda?: string;
          categoria?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Deal Products (M2M)
      // ==============================
      crm_deal_products: {
        Row: {
          id: string;
          deal_id: string;
          product_id: string;
          quantidade: number;
          preco_unitario: number;
          desconto_pct: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          product_id: string;
          quantidade?: number;
          preco_unitario: number;
          desconto_pct?: number;
          total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          product_id?: string;
          quantidade?: number;
          preco_unitario?: number;
          desconto_pct?: number;
          total?: number;
          created_at?: string;
        };
      };

      // ==============================
      // CRM — Attachments
      // ==============================
      crm_attachments: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          file_name: string;
          file_url: string;
          storage_path: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          version: number;
          parent_id: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          file_name: string;
          file_url: string;
          storage_path?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          version?: number;
          parent_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          file_name?: string;
          file_url?: string;
          storage_path?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          version?: number;
          parent_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };

      // ==============================
      // CRM — Followers
      // ==============================
      crm_followers: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          corretor_id: string;
          auto_follow: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          corretor_id: string;
          auto_follow?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          corretor_id?: string;
          auto_follow?: boolean;
          created_at?: string;
        };
      };

      // ==============================
      // CRM — Changelog (Audit Trail)
      // ==============================
      crm_changelog: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          field_name: string;
          old_value: string | null;
          new_value: string | null;
          changed_by: string | null;
          changed_by_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          field_name: string;
          old_value?: string | null;
          new_value?: string | null;
          changed_by?: string | null;
          changed_by_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          field_name?: string;
          old_value?: string | null;
          new_value?: string | null;
          changed_by?: string | null;
          changed_by_type?: string;
          created_at?: string;
        };
      };

      // ==============================
      // CRM — Comments
      // ==============================
      crm_comments: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          corretor_id: string;
          comment_text: string;
          mentions: string[];
          parent_comment_id: string | null;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          corretor_id: string;
          comment_text: string;
          mentions?: string[];
          parent_comment_id?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          corretor_id?: string;
          comment_text?: string;
          mentions?: string[];
          parent_comment_id?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Quotes (Cotações/Propostas)
      // ==============================
      crm_quotes: {
        Row: {
          id: string;
          deal_id: string;
          quote_number: string;
          titulo: string;
          status: string;
          subtotal: number;
          desconto_valor: number;
          imposto_valor: number;
          total: number;
          moeda: string;
          valido_ate: string | null;
          pdf_url: string | null;
          view_count: number;
          last_viewed_at: string | null;
          accepted_at: string | null;
          declined_at: string | null;
          observacoes: string | null;
          termos: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          quote_number?: string;
          titulo: string;
          status?: string;
          subtotal?: number;
          desconto_valor?: number;
          imposto_valor?: number;
          total?: number;
          moeda?: string;
          valido_ate?: string | null;
          pdf_url?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          observacoes?: string | null;
          termos?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          quote_number?: string;
          titulo?: string;
          status?: string;
          subtotal?: number;
          desconto_valor?: number;
          imposto_valor?: number;
          total?: number;
          moeda?: string;
          valido_ate?: string | null;
          pdf_url?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          observacoes?: string | null;
          termos?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Quote Items
      // ==============================
      crm_quote_items: {
        Row: {
          id: string;
          quote_id: string;
          product_id: string | null;
          nome: string;
          descricao: string | null;
          quantidade: number;
          preco_unitario: number;
          desconto_pct: number;
          total: number;
          posicao: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          product_id?: string | null;
          nome: string;
          descricao?: string | null;
          quantidade?: number;
          preco_unitario: number;
          desconto_pct?: number;
          total: number;
          posicao?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          product_id?: string | null;
          nome?: string;
          descricao?: string | null;
          quantidade?: number;
          preco_unitario?: number;
          desconto_pct?: number;
          total?: number;
          posicao?: number;
          created_at?: string;
        };
      };

      // ==============================
      // CRM — Workflows
      // ==============================
      crm_workflows: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          trigger_type: string;
          trigger_config: Json;
          actions: Json;
          is_active: boolean;
          execution_count: number;
          last_executed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          trigger_type: string;
          trigger_config?: Json;
          actions?: Json;
          is_active?: boolean;
          execution_count?: number;
          last_executed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          trigger_type?: string;
          trigger_config?: Json;
          actions?: Json;
          is_active?: boolean;
          execution_count?: number;
          last_executed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==============================
      // CRM — Workflow Executions
      // ==============================
      crm_workflow_executions: {
        Row: {
          id: string;
          workflow_id: string;
          entity_type: string | null;
          entity_id: string | null;
          status: string;
          error_message: string | null;
          duration_ms: number | null;
          input_data: Json;
          output_data: Json;
          executed_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          entity_type?: string | null;
          entity_id?: string | null;
          status: string;
          error_message?: string | null;
          duration_ms?: number | null;
          input_data?: Json;
          output_data?: Json;
          executed_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          status?: string;
          error_message?: string | null;
          duration_ms?: number | null;
          input_data?: Json;
          output_data?: Json;
          executed_at?: string;
        };
      };

      // ==============================
      // CRM — Custom Fields Config
      // ==============================
      crm_custom_fields_config: {
        Row: {
          id: string;
          entity_type: string;
          field_key: string;
          field_label: string;
          field_type: string;
          options: Json;
          is_required: boolean;
          posicao: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          field_key: string;
          field_label: string;
          field_type: string;
          options?: Json;
          is_required?: boolean;
          posicao?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          field_key?: string;
          field_label?: string;
          field_type?: string;
          options?: Json;
          is_required?: boolean;
          posicao?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };

      // ==============================
      // CRM — Notifications
      // ==============================
      crm_notifications: {
        Row: {
          id: string;
          corretor_id: string;
          tipo: string;
          titulo: string;
          mensagem: string | null;
          entity_type: string | null;
          entity_id: string | null;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corretor_id: string;
          tipo: string;
          titulo: string;
          mensagem?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          corretor_id?: string;
          tipo?: string;
          titulo?: string;
          mensagem?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
      };

      // ==============================
      // Corretores (base de usuários)
      // ==============================
      corretores: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string | null;
          whatsapp: string | null;
          foto_url: string | null;
          cpf: string | null;
          status: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone?: string | null;
          whatsapp?: string | null;
          foto_url?: string | null;
          cpf?: string | null;
          status?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string | null;
          whatsapp?: string | null;
          foto_url?: string | null;
          cpf?: string | null;
          status?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };

    Views: {
      crm_deal_metrics: {
        Row: {
          pipeline_id: string | null;
          total_deals: number | null;
          deals_ganhos: number | null;
          deals_perdidos: number | null;
          deals_abertos: number | null;
          valor_total_pipeline: number | null;
          valor_ganho: number | null;
          valor_perdido: number | null;
          valor_aberto: number | null;
          ticket_medio: number | null;
          forecast_ponderado: number | null;
          taxa_conversao: number | null;
        };
      };

      crm_deal_by_stage: {
        Row: {
          stage_id: string | null;
          pipeline_id: string | null;
          pipeline_nome: string | null;
          nome: string | null;
          cor: string | null;
          posicao: number | null;
          total_deals: number | null;
          valor_total: number | null;
          valor_medio: number | null;
          deals_hot: number | null;
          deals_stale: number | null;
        };
      };

      crm_corretor_performance: {
        Row: {
          corretor_id: string | null;
          corretor_nome: string | null;
          foto_url: string | null;
          total_deals: number | null;
          deals_ganhos: number | null;
          deals_perdidos: number | null;
          valor_ganho: number | null;
          valor_pipeline: number | null;
          taxa_conversao: number | null;
        };
      };
    };

    Functions: {
      move_crm_deal: {
        Args: {
          p_deal_id: string;
          p_new_stage_id: string;
          p_new_position: number;
          p_corretor_id: string;
        };
        Returns: Json;
      };
      generate_crm_quote_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ========================================
// HELPER TYPES
// ========================================

/** Extrai o Row type de uma tabela */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Extrai o Insert type de uma tabela */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Extrai o Update type de uma tabela */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/** Extrai o Row type de uma view */
export type ViewRow<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
