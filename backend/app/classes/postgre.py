import psycopg2

class PostgreSQL():

    def __init__(self,db_host,db_port,db_name,db_user,db_password):
        self.db_host=db_host
        self.db_port=db_port
        self.db_name=db_name
        self.db_user=db_user
        self.db_password=db_password
        self.conn=None
        self.cur=None

    def create_connection(self):
        try:
            self.conn=psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                dbname=self.db_name,
                user=self.db_user,
                password=self.db_password
            )

            self.cur=self.conn.cursor()
            print('CONEXION EXITOSA')
        except Exception as e:
            print(f'ERROR DE CONEXION A LA DB: {e}')

    def close_connection(self,commit=False):
        try:
            if self.conn:
                if commit:
                    self.conn.commit()
                if self.cur:
                    self.cur.close()
                self.conn.close()
                print('CONEXION A LA DB CERRADA EXITOSAMENTE')
        except Exception as e:
            print(f'ERROR AL CERRAR LA CONEXION CON LA DB: {e}')


    def execute_query(self,query,params=None,fetchall=False,fetchone=False,commit=False):
        if not self.conn or not self.cur:
            print('NO HAY UNA CONEXION ACTIVA A LA BASE DE DATOS')
            return
        
        if fetchall and fetchone:
            print('SOLO PUEDE HACER UNA OPCION "FETCHALL" O "fetchone"')
            return

        try:
            self.cur.execute(query,params)
            if commit:
                self.conn.commit()
            
            if fetchone:
                return self.cur.fetchone()
            
            if fetchall:
                return self.cur.fetchall()
            
            return self.cur.rowcount
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            print(f'ERROR: {e}, EJECUTANDO ROLLBACK')
            raise