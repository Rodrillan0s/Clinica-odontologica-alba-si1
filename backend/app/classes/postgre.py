import psycopg2

class PostgreSQL():
    def __init__(self, db_host, db_port, db_name, db_user, db_password):
        self.db_host, self.db_port, self.db_name = db_host, db_port, db_name
        self.db_user, self.db_password = db_user, db_password
        self.conn = None

    def create_connection(self):
        if self.conn and not self.conn.closed: return
        try:
            self.conn = psycopg2.connect(
                host=self.db_host, port=self.db_port, 
                dbname=self.db_name, user=self.db_user, password=self.db_password
            )
            print('--- CONEXION EXITOSA ---')
        except Exception as e: print(f'ERROR DB: {e}')

    def execute_query(self, query, params=None, fetchall=False, fetchone=False, commit=False):
        self.create_connection()
        cur = self.conn.cursor() # Cursor local para evitar que choquen peticiones
        try:
            cur.execute(query, params)
            if commit: self.conn.commit()
            
            # Si no hay resultados (como en un CALL), devolvemos algo vacío
            if cur.description is None:
                cur.close()
                return [] if fetchall else None

            res = cur.fetchall() if fetchall else (cur.fetchone() if fetchone else cur.rowcount)
            cur.close()
            return res
        except Exception as e:
            if self.conn: self.conn.rollback()
            cur.close()
            print(f'ERROR QUERY: {e}')
            raise e

    def close_connection(self, commit=False):
        if self.conn:
            if commit: self.conn.commit()
            self.conn.close()
            print('CONEXION CERRADA')