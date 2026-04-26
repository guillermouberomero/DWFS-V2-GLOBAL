# 🧪 Ejercicio: Fundamentos de Spring Boot — Sistema de Biblioteca

## Contexto

Vas a crear desde cero una aplicación Spring Boot que simule un **sistema de gestión de una biblioteca**. El objetivo es practicar los conceptos fundamentales del framework: Beans, inyección de dependencias, scopes, qualifiers y configuración externalizada.

> **Requisitos previos**: Java (LTS), Spring Boot (LTS), Lombok como dependencia.

---

## Estructura esperada

```
src/main/java/com/unir/
├── LibraryApplication.java               (clase main con @SpringBootApplication)
├── model/
│   ├── Book.java
│   └── Shelf.java
├── component/
│   ├── LibraryInfoComponent.java
│   └── LoanTicket.java
├── configuration/
│   ├── LibraryConfiguration.java
│   └── ConnectionProperties.java
├── service/
│   ├── CatalogService.java
│   ├── LombokCatalogService.java
│   └── NotificationService.java
└── controller/
    └── LibraryController.java

src/main/resources/
└── application.yml
```

---

## Parte 1 — Modelos (POJOs)

Crea dos clases en el paquete `model`. **No son Beans de Spring** por sí solas; se registrarán más adelante desde una clase de configuración.

### 1.1 `Book.java`

- Campos `final`: `String title` y `String author`.
- Constructor con ambos parámetros.
- Getters.
- `toString()` que devuelva: `Book{title='...', author='...'}`.

### 1.2 `Shelf.java`

- Campos `final`: `String section` y `Book featuredBook`.
- Constructor con ambos parámetros.
- Getters.
- `toString()` que devuelva: `Shelf{section='...', featuredBook=...}`.

---

## Parte 2 — Configuración YAML

### 2.1 `application.yml`

Crea el fichero con el siguiente contenido:

```yaml
server:
  port: ${PORT:8080}

# Propiedades personalizadas para demostrar @Value
library:
  name: "Biblioteca Central UNIR"
  location: "Logroño"
  max-loans: 5
  open-sundays: false

# Propiedades agrupadas para demostrar @ConfigurationProperties
connection:
  host: "192.168.1.100"
  port: 5432
  database-name: "library_db"
  auth:
    user: "librarian"
    secret: "b1bl10t3c4"
```

> 💡 Las propiedades bajo `library` se usarán con `@Value`. Las de `connection` se mapearán con `@ConfigurationProperties`.

---

## Parte 3 — Componentes (`@Component`)

### 3.1 `LibraryInfoComponent.java` (paquete `component`)

- Anótala con `@Component`.
- Usa `@Value` para inyectar **directamente en los campos** las propiedades:
  - `library.name` → `String libraryName`
  - `library.location` → `String location`
  - `library.max-loans` → `int maxLoans`
  - `library.open-sundays` → `boolean openSundays`
- Crea getters para todos los campos.
- Crea un método `getDescription()` que devuelva un `String` con formato:
  `"Biblioteca: Biblioteca Central UNIR (Logroño) | Préstamos máx: 5 | Domingos: false"`

> 🎯 **Concepto**: Inyección por atributo con `@Value`. Spring lee del `application.yml` y asigna los valores sin necesidad de constructor ni setter.

### 3.2 `LoanTicket.java` (paquete `component`)

- Anótala con `@Component` y **`@Scope("prototype")`**.
- Usa `@Slf4j` de Lombok para logging.
- En el constructor, genera un `ticketId` aleatorio (usa `UUID.randomUUID().toString().substring(0, 8)`).
- Loguea con `log.info` la creación del ticket incluyendo el `ticketId`.
- Crea un getter para `ticketId` y un `toString()`.

> 🎯 **Concepto**: Scope **prototype** — cada vez que se solicita este Bean, Spring crea una **nueva instancia** (a diferencia del singleton por defecto). Simula que cada préstamo genera un ticket diferente.

---

## Parte 4 — Clase de configuración (`@Configuration`)

### 4.1 `LibraryConfiguration.java` (paquete `configuration`)

Anótala con `@Configuration` y `@Slf4j`. Define los siguientes Beans con métodos `@Bean`:

| Método | Tipo | Nombre del Bean | Scope | Descripción |
|---|---|---|---|---|
| `novelBook()` | `Book` | `novelBook` | singleton | `new Book("Cien años de soledad", "Gabriel García Márquez")` |
| `scienceBook()` | `Book` | `scienceBook` | singleton | `new Book("Breve historia del tiempo", "Stephen Hawking")` |
| `fictionShelf(Book)` | `Shelf` | `fictionShelf` | singleton | Usa `@Qualifier("novelBook")` en el parámetro |
| `scienceShelf(Book)` | `Shelf` | `scienceShelf` | singleton | Usa `@Qualifier("scienceBook")` en el parámetro |
| `donatedBook()` | `Book` | `donatedBook` | **prototype** | `new Book("Donación #" + System.currentTimeMillis(), "Anónimo")` |

En cada método, loguea con `log.info` un mensaje indicando qué Bean se está creando.

> 🎯 **Conceptos**:
> - `@Configuration` + `@Bean`: registrar Beans manualmente.
> - `@Qualifier`: cuando hay **dos o más Beans del mismo tipo**, permite indicar cuál inyectar. Sin él, Spring lanzaría `NoUniqueBeanDefinitionException`.
> - `@Scope("prototype")`: crear nuevas instancias en cada petición (simulando donaciones de libros distintas).

### 4.2 `ConnectionProperties.java` (paquete `configuration`)

- Anótala con `@Configuration` y `@ConfigurationProperties(prefix = "connection")`.
- Usa `@Getter` y `@Setter` de Lombok.
- Campos: `String host`, `int port`, `String databaseName`, `Auth auth`.
- Crea una clase estática interna `Auth` con campos `String user` y `String secret` (también con `@Getter` y `@Setter`).
- Crea un método `getSummary()` que devuelva: `"Conexión: 192.168.1.100:5432/library_db (user: librarian)"`.

> 🎯 **Concepto**: `@ConfigurationProperties` mapea un **bloque completo** del YAML a un objeto Java (incluyendo objetos anidados), a diferencia de `@Value` que inyecta propiedad a propiedad.

---

## Parte 5 — Servicios (`@Service`)

### 5.1 `CatalogService.java` — Inyección por constructor (manual)

- Anótala con `@Service` y `@Slf4j`.
- Campo `final`: `LibraryInfoComponent libraryInfo`.
- Escribe el constructor **manualmente** recibiendo `LibraryInfoComponent` como parámetro. Loguea con `log.info` la creación.
- Método `search(String keyword)` que devuelva: `"Buscando '{keyword}' en el catálogo de {libraryName}"`.

> 🎯 **Concepto**: Inyección por constructor — la forma **recomendada**. El campo puede ser `final`, inmutable y fácil de testear.

### 5.2 `LombokCatalogService.java` — Inyección por constructor (Lombok)

- Anótala con `@Service` y `@RequiredArgsConstructor`.
- Campo `final`: `LibraryInfoComponent libraryInfo`.
- **No escribas constructor**: Lombok lo genera automáticamente para todos los campos `final`.
- Método `search(String keyword)` que devuelva: `"Buscando '{keyword}' (Lombok) — Biblioteca: {libraryName} en {location}"`.

> 🎯 **Concepto**: `@RequiredArgsConstructor` es equivalente a escribir manualmente el constructor con inyección. Es la forma más usada en proyectos reales con Spring + Lombok.

### 5.3 `NotificationService.java` — Inyección por setter

- Anótala con `@Service` y `@Slf4j`.
- Campo **no final**: `LibraryInfoComponent libraryInfo`.
- Crea un setter `setLibraryInfo(LibraryInfoComponent libraryInfo)` anotado con `@Autowired`. Loguea con `log.info`.
- Método `getNotice()` que devuelva: `"Aviso de {libraryName}: Abierto domingos: {openSundays}"`.

> ⚠️ **Concepto**: Inyección por setter — **NO recomendada**. El campo no puede ser `final`, la dependencia podría ser `null` y es más difícil de testear. Se muestra con fines didácticos.

---

## Parte 6 — Controlador REST

### 6.1 `LibraryController.java` (paquete `controller`)

- Anótala con `@RestController`.
- Inyecta **por constructor explícito** las siguientes dependencias:
  - `CatalogService`
  - `LombokCatalogService`
  - `NotificationService`
  - `LibraryInfoComponent`
  - `Shelf` con `@Qualifier("fictionShelf")`
  - `Shelf` con `@Qualifier("scienceShelf")`
  - `Book` con `@Qualifier("novelBook")`
  - `Book` con `@Qualifier("scienceBook")`
  - `ConnectionProperties`
  - `ApplicationContext` (para obtener Beans prototype manualmente)

- Crea un endpoint `GET /library` con un parámetro opcional `keyword` (valor por defecto: `"Java"`).
- El endpoint debe devolver un `Map<String, Object>` con las siguientes claves:

| Clave | Valor |
|---|---|
| `1_constructor_injection` | `catalogService.search(keyword)` |
| `2_lombok_constructor` | `lombokCatalogService.search(keyword)` |
| `3_setter_injection` | `notificationService.getNotice()` |
| `4_value_injection` | `libraryInfo.getDescription()` |
| `5_configuration_bean` | `fictionShelf.toString()` |
| `6_qualifier_novel_book` | `novelBook.toString()` |
| `6_qualifier_science_book` | `scienceBook.toString()` |
| `6_qualifier_fiction_shelf` | `fictionShelf.toString()` |
| `6_qualifier_science_shelf` | `scienceShelf.toString()` |
| `7_config_properties_summary` | `connectionProperties.getSummary()` |
| `7_config_properties_host` | `connectionProperties.getHost()` |
| `7_config_properties_port` | `connectionProperties.getPort()` |
| `7_config_properties_auth_user` | `connectionProperties.getAuth().getUser()` |
| `8_prototype_ticket_1` | ticketId de una primera instancia de `LoanTicket` obtenida con `context.getBean(...)` |
| `8_prototype_ticket_2` | ticketId de una segunda instancia de `LoanTicket` obtenida con `context.getBean(...)` |
| `8_prototype_are_same` | Comparación `ticket1 == ticket2` (debe ser `false`) |

> 💡 **¿Por qué constructor explícito y no `@RequiredArgsConstructor`?** Porque necesitas `@Qualifier` en algunos parámetros del constructor, y Lombok no permite anotaciones en los parámetros del constructor generado.

---

## Parte 7 — Verificación

Arranca la aplicación y accede a:

```
http://localhost:8080/library?keyword=Spring
```

Deberías ver un JSON con las 16 claves del mapa. Comprueba:

1. ✅ Las búsquedas incluyen la keyword proporcionada.
2. ✅ Los libros y estanterías muestran los datos correctos.
3. ✅ El resumen de la conexión muestra `192.168.1.100:5432/library_db`.
4. ✅ Los dos tickets de préstamo tienen **IDs diferentes**.
5. ✅ `8_prototype_are_same` es `false`.

Revisa también los logs de la consola: deberías ver los mensajes `>>> Creando Bean ...` que indican el orden de creación de los Beans al arrancar.

---

## Resumen de conceptos practicados

| Concepto | Dónde se practica |
|---|---|
| `@Configuration` + `@Bean` | `LibraryConfiguration` |
| `@Component` / `@Service` | `LibraryInfoComponent`, `LoanTicket`, todos los servicios |
| Inyección por **constructor** | `CatalogService` |
| Inyección por **constructor con Lombok** | `LombokCatalogService` |
| Inyección por **setter** | `NotificationService` |
| Inyección por **atributo** (`@Value`) | `LibraryInfoComponent` |
| `@Qualifier` | `LibraryConfiguration`, `LibraryController` |
| `@ConfigurationProperties` | `ConnectionProperties` |
| Scope **singleton** (por defecto) | Todos los Beans excepto `donatedBook` y `LoanTicket` |
| Scope **prototype** | `donatedBook`, `LoanTicket` |
| `@Slf4j` + `log.info` | Todas las clases con logging |
| `@RestController` + `@GetMapping` | `LibraryController` |

