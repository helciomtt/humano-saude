"""
Serviço de integração com Supabase
Gerencia a conexão e operações com o banco de dados
"""

import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv()

class SupabaseService:
    """Serviço para gerenciar operações com Supabase"""
    
    def __init__(self):
        """Inicializa conexão com Supabase"""
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            logger.warning("⚠️ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_KEY no .env")
            self.client: Optional[Client] = None
        else:
            try:
                self.client: Client = create_client(self.url, self.key)
                logger.info("✅ Conexão com Supabase estabelecida")
            except Exception as e:
                logger.error(f"❌ Erro ao conectar com Supabase: {e}")
                self.client = None
    
    def is_connected(self) -> bool:
        """Verifica se está conectado ao Supabase"""
        return self.client is not None
    
    # ==========================================
    # CRUD - Leads
    # ==========================================
    
    async def criar_lead(
        self,
        nome: str,
        whatsapp: str,
        email: Optional[str] = None,
        operadora_atual: Optional[str] = None,
        valor_atual: Optional[float] = None,
        idades: Optional[List[int]] = None,
        economia_estimada: Optional[float] = None,
        valor_proposto: Optional[float] = None,
        tipo_contratacao: Optional[str] = None,
        observacoes: Optional[str] = None,
        dados_pdf: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Cria um novo lead no banco de dados
        
        Args:
            nome: Nome completo do lead
            whatsapp: Telefone/WhatsApp
            email: E-mail (opcional)
            operadora_atual: Operadora atual
            valor_atual: Valor mensal atual
            idades: Lista de idades dos beneficiários
            economia_estimada: Economia calculada
            valor_proposto: Valor da proposta
            tipo_contratacao: PF ou PME
            observacoes: Observações gerais
            dados_pdf: Dados brutos do PDF
            
        Returns:
            Dicionário com dados do lead criado ou None em caso de erro
        """
        if not self.is_connected():
            logger.error("❌ Supabase não conectado")
            return None
        
        try:
            lead_data = {
                "nome": nome,
                "whatsapp": whatsapp,
                "email": email,
                "operadora_atual": operadora_atual,
                "valor_atual": valor_atual,
                "idades": idades or [],
                "economia_estimada": economia_estimada,
                "valor_proposto": valor_proposto,
                "tipo_contratacao": tipo_contratacao,
                "observacoes": observacoes,
                "dados_pdf": dados_pdf or {},
                "status": "novo",
                "origem": "scanner_pdf"
            }
            
            response = self.client.table("insurance_leads").insert(lead_data).execute()
            
            if response.data:
                lead_criado = response.data[0]
                logger.info(f"✅ Lead criado: {lead_criado['id']} - {nome}")
                return lead_criado
            else:
                logger.error(f"❌ Erro ao criar lead: {response}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Erro ao criar lead: {e}")
            return None
    
    async def buscar_lead_por_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Busca um lead pelo ID"""
        if not self.is_connected():
            return None
        
        try:
            response = self.client.table("insurance_leads")\
                .select("*")\
                .eq("id", lead_id)\
                .execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Erro ao buscar lead: {e}")
            return None
    
    async def buscar_lead_por_whatsapp(self, whatsapp: str) -> Optional[Dict[str, Any]]:
        """Busca um lead pelo WhatsApp"""
        if not self.is_connected():
            return None
        
        try:
            response = self.client.table("insurance_leads")\
                .select("*")\
                .eq("whatsapp", whatsapp)\
                .eq("arquivado", False)\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Erro ao buscar lead: {e}")
            return None
    
    async def listar_leads(
        self,
        status: Optional[str] = None,
        limite: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Lista leads com filtros opcionais
        
        Args:
            status: Filtrar por status (novo, contatado, etc)
            limite: Número máximo de resultados
            offset: Offset para paginação
            
        Returns:
            Lista de leads
        """
        if not self.is_connected():
            return []
        
        try:
            query = self.client.table("insurance_leads")\
                .select("*")\
                .eq("arquivado", False)\
                .order("created_at", desc=True)\
                .range(offset, offset + limite - 1)
            
            if status:
                query = query.eq("status", status)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"❌ Erro ao listar leads: {e}")
            return []
    
    async def atualizar_status_lead(
        self,
        lead_id: str,
        novo_status: str,
        observacao: Optional[str] = None
    ) -> bool:
        """
        Atualiza o status de um lead
        
        Args:
            lead_id: ID do lead
            novo_status: Novo status (novo, contatado, negociacao, etc)
            observacao: Observação sobre a mudança
            
        Returns:
            True se atualizado com sucesso
        """
        if not self.is_connected():
            return False
        
        try:
            # Buscar lead atual para o histórico
            lead_atual = await self.buscar_lead_por_id(lead_id)
            if not lead_atual:
                return False
            
            # Preparar histórico
            import datetime
            historico = lead_atual.get("historico", [])
            historico.append({
                "timestamp": datetime.datetime.now().isoformat(),
                "evento": "mudanca_status",
                "status_anterior": lead_atual["status"],
                "status_novo": novo_status,
                "observacao": observacao
            })
            
            # Atualizar
            response = self.client.table("insurance_leads")\
                .update({
                    "status": novo_status,
                    "historico": historico
                })\
                .eq("id", lead_id)\
                .execute()
            
            if response.data:
                logger.info(f"✅ Status atualizado: {lead_id} -> {novo_status}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar status: {e}")
            return False
    
    async def arquivar_lead(self, lead_id: str) -> bool:
        """Arquiva um lead"""
        if not self.is_connected():
            return False
        
        try:
            response = self.client.table("insurance_leads")\
                .update({"arquivado": True})\
                .eq("id", lead_id)\
                .execute()
            
            return bool(response.data)
        except Exception as e:
            logger.error(f"❌ Erro ao arquivar lead: {e}")
            return False
    
    # ==========================================
    # Estatísticas
    # ==========================================
    
    async def obter_dashboard_stats(self) -> Optional[Dict[str, Any]]:
        """
        Obtém estatísticas do dashboard
        
        Returns:
            Dicionário com estatísticas ou None em caso de erro
        """
        if not self.is_connected():
            return None
        
        try:
            response = self.client.table("dashboard_stats")\
                .select("*")\
                .execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Erro ao obter estatísticas: {e}")
            return None
    
    async def obter_leads_por_operadora(self) -> List[Dict[str, Any]]:
        """Obtém estatísticas agrupadas por operadora"""
        if not self.is_connected():
            return []
        
        try:
            response = self.client.table("leads_por_operadora")\
                .select("*")\
                .execute()
            
            return response.data or []
        except Exception as e:
            logger.error(f"❌ Erro ao obter leads por operadora: {e}")
            return []
    
    async def obter_pipeline_vendas(self) -> List[Dict[str, Any]]:
        """Obtém visão do funil de vendas"""
        if not self.is_connected():
            return []
        
        try:
            response = self.client.table("pipeline_vendas")\
                .select("*")\
                .execute()
            
            return response.data or []
        except Exception as e:
            logger.error(f"❌ Erro ao obter pipeline de vendas: {e}")
            return []


# Instância global do serviço
supabase_service = SupabaseService()
