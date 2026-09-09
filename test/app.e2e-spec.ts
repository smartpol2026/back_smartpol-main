import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('SmartPol API E2E Tests', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health - debe retornar estado de la API', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('Autenticación', () => {
    let token: string;
    const testUser = {
      email: 'testauth' + Date.now() + '@example.com',
      contraseña: 'TestPassword123',
    };

    it('POST /auth/register - debe registrar un nuevo usuario', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('message');
          token = res.body.access_token;
        });
    });

    it('POST /auth/login - debe hacer login correctamente', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('access_token');
          token = res.body.access_token;
        });
    });

    it('GET /auth/profile - debe obtener el perfil del usuario autenticado', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
        });
    });

    it('PATCH /auth/change-password - debe cambiar la contraseña', () => {
      return request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contraseñaActual: 'TestPassword123',
          contraseñaNueva: 'NewPassword456',
          contraseñaConfirm: 'NewPassword456',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('Corporaciones', () => {
    let corporacionId: number;

    it('POST /corporaciones - debe crear una corporación', () => {
      return request(app.getHttpServer())
        .post('/corporaciones')
        .send({
          nombre: 'Movimiento Democrático',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('nombre', 'Movimiento Democrático');
          corporacionId = res.body.id;
        });
    });

    it('GET /corporaciones - debe obtener todas las corporaciones', () => {
      return request(app.getHttpServer())
        .get('/corporaciones')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /corporaciones/:id - debe obtener una corporación por id', () => {
      return request(app.getHttpServer())
        .get(`/corporaciones/${corporacionId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', corporacionId);
          expect(res.body).toHaveProperty('nombre');
        });
    });

    it('PATCH /corporaciones/:id - debe actualizar una corporación', () => {
      return request(app.getHttpServer())
        .patch(`/corporaciones/${corporacionId}`)
        .send({
          nombre: 'Movimiento Democrático Actualizado',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('nombre', 'Movimiento Democrático Actualizado');
        });
    });
  });

  describe('Votantes', () => {
    let votanteId: number;
    const votanteData = {
      nombre: 'Carlos',
      apellido: 'García',
      identificacion: '1234567890' + Date.now(),
      genero: 'M',
      tipoSangre: 'O+',
      fechaNacimiento: '1990-01-15',
      celular: '3001234567',
      población: 'Bogotá',
      departamento: 'Cundinamarca',
      municipio: 'Bogotá',
      barrio: 'Centro',
      email: 'votante' + Date.now() + '@example.com',
      ocupacion: 'Ingeniero',
      lugarVotacion: 'Colegio Central',
      puestoVotacion: 'Puesto 1',
      estadoPolitico: 'Activo',
    };

    it('POST /votantes - debe crear un votante', () => {
      return request(app.getHttpServer())
        .post('/votantes')
        .send(votanteData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('nombre', votanteData.nombre);
          expect(res.body).toHaveProperty('email', votanteData.email);
          votanteId = res.body.id;
        });
    });

    it('GET /votantes - debe obtener todos los votantes', () => {
      return request(app.getHttpServer())
        .get('/votantes')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /votantes/:id - debe obtener un votante por id', () => {
      return request(app.getHttpServer())
        .get(`/votantes/${votanteId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', votanteId);
          expect(res.body).toHaveProperty('nombre', votanteData.nombre);
        });
    });

    it('PATCH /votantes/:id - debe actualizar un votante', () => {
      return request(app.getHttpServer())
        .patch(`/votantes/${votanteId}`)
        .send({
          celular: '3109876543',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('celular', '3109876543');
        });
    });
  });

  describe('Líderes', () => {
    let liderId: number;
    const liderData = {
      nombre: 'Juan Pérez García',
      documento: '1234567890' + Date.now(),
      municipio: 'Bogotá',
      telefono: '3001234567',
    };

    it('POST /lideres - debe crear un líder', () => {
      return request(app.getHttpServer())
        .post('/lideres')
        .send(liderData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('nombre', liderData.nombre);
          liderId = res.body.id;
        });
    });

    it('GET /lideres - debe obtener todos los líderes', () => {
      return request(app.getHttpServer())
        .get('/lideres')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /lideres/:id - debe obtener un líder por id', () => {
      return request(app.getHttpServer())
        .get(`/lideres/${liderId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', liderId);
          expect(res.body).toHaveProperty('nombre', liderData.nombre);
        });
    });

    it('PATCH /lideres/:id - debe actualizar un líder', () => {
      return request(app.getHttpServer())
        .patch(`/lideres/${liderId}`)
        .send({
          telefono: '3009876543',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('telefono', '3009876543');
        });
    });

    it('DELETE /lideres/:id - debe eliminar un líder', () => {
      return request(app.getHttpServer())
        .delete(`/lideres/${liderId}`)
        .expect(200);
    });
  });

  describe('Candidatos', () => {
    let candidatoId: number;
    let votanteId: number;
    let liderId: number;
    
    const candidatoData = {
      nombre: 'Juan Duarte',
      partido: 'Partido Colombiano',
      número: 1,
      corporacion_id: 1,
    };

    const votanteData = {
      nombre: 'Pedro',
      apellido: 'López',
      identificacion: '9876543210' + Date.now(),
      genero: 'M',
      tipoSangre: 'A+',
      fechaNacimiento: '1995-05-20',
      celular: '3107654321',
      población: 'Medellín',
      departamento: 'Antioquia',
      municipio: 'Medellín',
      barrio: 'Laureles',
      email: 'votante' + Date.now() + '2@example.com',
      ocupacion: 'Contador',
      lugarVotacion: 'Colegio San José',
      puestoVotacion: 'Puesto 2',
      estadoPolitico: 'Pendiente',
    };

    const liderData = {
      nombre: 'Maria González',
      documento: '1111111111' + Date.now(),
      municipio: 'Cali',
      telefono: '3002222222',
    };

    it('POST /candidatos - debe crear un candidato', () => {
      return request(app.getHttpServer())
        .post('/candidatos')
        .send(candidatoData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('nombre', candidatoData.nombre);
          expect(res.body).toHaveProperty('partido', candidatoData.partido);
          candidatoId = res.body.id;
        });
    });

    it('POST /votantes (para candidatos) - debe crear un votante', () => {
      return request(app.getHttpServer())
        .post('/votantes')
        .send(votanteData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          votanteId = res.body.id;
        });
    });

    it('POST /lideres (para candidatos) - debe crear un líder', () => {
      return request(app.getHttpServer())
        .post('/lideres')
        .send(liderData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          liderId = res.body.id;
        });
    });

    it('GET /candidatos - debe obtener todos los candidatos', () => {
      return request(app.getHttpServer())
        .get('/candidatos')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /candidatos/:id - debe obtener un candidato por id', () => {
      return request(app.getHttpServer())
        .get(`/candidatos/${candidatoId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidatoId);
          expect(res.body).toHaveProperty('nombre', candidatoData.nombre);
        });
    });

    it('PATCH /candidatos/:id - debe actualizar un candidato', () => {
      return request(app.getHttpServer())
        .patch(`/candidatos/${candidatoId}`)
        .send({
          número: 2,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('número', 2);
        });
    });

    it('POST /candidatos/:id/lideres/:liderId - debe asignar un líder a un candidato', () => {
      return request(app.getHttpServer())
        .post(`/candidatos/${candidatoId}/lideres/${liderId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidatoId);
        });
    });

    it('POST /candidatos/:id/votantes/:votanteId - debe asignar un votante a un candidato', () => {
      return request(app.getHttpServer())
        .post(`/candidatos/${candidatoId}/votantes/${votanteId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidatoId);
        });
    });

    it('DELETE /candidatos/:id - debe eliminar un candidato', () => {
      return request(app.getHttpServer())
        .delete(`/candidatos/${candidatoId}`)
        .expect(200);
    });

    it('DELETE /votantes/:id (para candidatos) - debe eliminar un votante', () => {
      return request(app.getHttpServer())
        .delete(`/votantes/${votanteId}`)
        .expect(200);
    });
  });

  describe('Usuarios', () => {
    let usuarioId: number;
    const usuarioData = {
      email: 'newuser' + Date.now() + '@example.com',
      contraseña: 'SecurePassword123',
    };

    it('POST /usuarios - debe crear un usuario', () => {
      return request(app.getHttpServer())
        .post('/usuarios')
        .send(usuarioData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', usuarioData.email);
          usuarioId = res.body.id;
        });
    });

    it('GET /usuarios - debe obtener todos los usuarios', () => {
      return request(app.getHttpServer())
        .get('/usuarios')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /usuarios/:id - debe obtener un usuario por id', () => {
      return request(app.getHttpServer())
        .get(`/usuarios/${usuarioId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', usuarioId);
          expect(res.body).toHaveProperty('email', usuarioData.email);
        });
    });

    it('PATCH /usuarios/:id - debe actualizar un usuario', () => {
      return request(app.getHttpServer())
        .patch(`/usuarios/${usuarioId}`)
        .send({
          email: 'updated' + Date.now() + '@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
        });
    });

    it('DELETE /usuarios/:id - debe eliminar un usuario', () => {
      return request(app.getHttpServer())
        .delete(`/usuarios/${usuarioId}`)
        .expect(200);
    });
  });
});

