/**
 * Tipos de la base de datos de Supabase.
 *
 * Escritos a mano siguiendo exactamente el formato que genera
 * `supabase gen types typescript`, de modo que se pueden regenerar sin
 * cambiar ninguna importación:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * Fuente de verdad del esquema: supabase/migrations/0001_init.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["workout_type"];
          gym_type: Database["public"]["Enums"]["gym_type"] | null;
          started_at: string;
          finished_at: string | null;
          duration_seconds: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["workout_type"];
          gym_type?: Database["public"]["Enums"]["gym_type"] | null;
          started_at?: string;
          finished_at?: string | null;
          /** Lo calcula el trigger `set_workout_duration`; no enviar desde el cliente. */
          duration_seconds?: never;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["workout_type"];
          gym_type?: Database["public"]["Enums"]["gym_type"] | null;
          started_at?: string;
          finished_at?: string | null;
          /** Lo calcula el trigger `set_workout_duration`; no enviar desde el cliente. */
          duration_seconds?: never;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      workout_type: "gym" | "bike" | "walking" | "running";
      gym_type:
        | "espalda"
        | "pecho"
        | "hombros"
        | "piernas"
        | "brazos"
        | "full_body"
        | "torso"
        | "otro";
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
