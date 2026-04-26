# ✅ Solución del Ejercicio: Sistema de Biblioteca

> Este documento contiene el código completo de cada archivo solicitado en el ejercicio.

---

## `application.yml`

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

---

## `model/Book.java`

```java
package com.unir.model;

public class Book {

    private final String title;
    private final String author;

    public Book(String title, String author) {
        this.title = title;
        this.author = author;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthor() {
        return author;
    }

    @Override
    public String toString() {
        return "Book{title='" + title + "', author='" + author + "'}";
    }
}
```

---

## `model/Shelf.java`

```java
package com.unir.model;

public class Shelf {

    private final String section;
    private final Book featuredBook;

    public Shelf(String section, Book featuredBook) {
        this.section = section;
        this.featuredBook = featuredBook;
    }

    public String getSection() {
        return section;
    }

    public Book getFeaturedBook() {
        return featuredBook;
    }

    @Override
    public String toString() {
        return "Shelf{section='" + section + "', featuredBook=" + featuredBook + "}";
    }
}
```

---

## `component/LibraryInfoComponent.java`

```java
package com.unir.component;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LibraryInfoComponent {

    @Value("${library.name}")
    private String libraryName;

    @Value("${library.location}")
    private String location;

    @Value("${library.max-loans}")
    private int maxLoans;

    @Value("${library.open-sundays}")
    private boolean openSundays;

    public String getDescription() {
        return String.format("Biblioteca: %s (%s) | Préstamos máx: %d | Domingos: %s",
                libraryName, location, maxLoans, openSundays);
    }

    public String getLibraryName() {
        return libraryName;
    }

    public String getLocation() {
        return location;
    }

    public int getMaxLoans() {
        return maxLoans;
    }

    public boolean isOpenSundays() {
        return openSundays;
    }
}
```

---

## `component/LoanTicket.java`

```java
package com.unir.component;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@Scope("prototype")
public class LoanTicket {

    private final String ticketId;

    public LoanTicket() {
        this.ticketId = UUID.randomUUID().toString().substring(0, 8);
        log.info(">>> Creando LoanTicket PROTOTYPE — ticketId: {}", ticketId);
    }

    public String getTicketId() {
        return ticketId;
    }

    @Override
    public String toString() {
        return "LoanTicket{ticketId='" + ticketId + "'}";
    }
}
```

---

## `configuration/LibraryConfiguration.java`

```java
package com.unir.configuration;

import com.unir.model.Book;
import com.unir.model.Shelf;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Slf4j
@Configuration
public class LibraryConfiguration {

    @Bean
    public Book novelBook() {
        log.info(">>> Creando Bean 'novelBook' (singleton)");
        return new Book("Cien años de soledad", "Gabriel García Márquez");
    }

    @Bean
    public Book scienceBook() {
        log.info(">>> Creando Bean 'scienceBook' (singleton)");
        return new Book("Breve historia del tiempo", "Stephen Hawking");
    }

    @Bean
    public Shelf fictionShelf(@Qualifier("novelBook") Book book) {
        log.info(">>> Creando Bean 'fictionShelf' (singleton) con libro: {}", book.getTitle());
        return new Shelf("Ficción", book);
    }

    @Bean
    public Shelf scienceShelf(@Qualifier("scienceBook") Book book) {
        log.info(">>> Creando Bean 'scienceShelf' (singleton) con libro: {}", book.getTitle());
        return new Shelf("Ciencia", book);
    }

    @Bean
    @Scope("prototype")
    public Book donatedBook() {
        log.info(">>> Creando Bean 'donatedBook' (prototype) — nueva donación cada vez");
        return new Book("Donación #" + System.currentTimeMillis(), "Anónimo");
    }
}
```

---

## `configuration/ConnectionProperties.java`

```java
package com.unir.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "connection")
@Getter
@Setter
public class ConnectionProperties {

    private String host;
    private int port;
    private String databaseName;
    private Auth auth;

    @Getter
    @Setter
    public static class Auth {
        private String user;
        private String secret;
    }

    public String getSummary() {
        return String.format("Conexión: %s:%d/%s (user: %s)",
                host, port, databaseName,
                auth != null ? auth.getUser() : "N/A");
    }
}
```

---

## `service/CatalogService.java`

```java
package com.unir.service;

import com.unir.component.LibraryInfoComponent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CatalogService {

    private final LibraryInfoComponent libraryInfo;

    public CatalogService(LibraryInfoComponent libraryInfo) {
        log.info(">>> Creando CatalogService con inyección por CONSTRUCTOR");
        this.libraryInfo = libraryInfo;
    }

    public String search(String keyword) {
        return String.format("Buscando '%s' en el catálogo de %s", keyword, libraryInfo.getLibraryName());
    }
}
```

---

## `service/LombokCatalogService.java`

```java
package com.unir.service;

import com.unir.component.LibraryInfoComponent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LombokCatalogService {

    private final LibraryInfoComponent libraryInfo;

    public String search(String keyword) {
        return String.format("Buscando '%s' (Lombok) — Biblioteca: %s en %s",
                keyword, libraryInfo.getLibraryName(), libraryInfo.getLocation());
    }
}
```

---

## `service/NotificationService.java`

```java
package com.unir.service;

import com.unir.component.LibraryInfoComponent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    private LibraryInfoComponent libraryInfo;

    @Autowired
    public void setLibraryInfo(LibraryInfoComponent libraryInfo) {
        log.info(">>> NotificationService: inyectando LibraryInfoComponent por SETTER");
        this.libraryInfo = libraryInfo;
    }

    public String getNotice() {
        return String.format("Aviso de %s: Abierto domingos: %s",
                libraryInfo.getLibraryName(), libraryInfo.isOpenSundays());
    }
}
```

---

## `controller/LibraryController.java`

```java
package com.unir.controller;

import com.unir.component.LibraryInfoComponent;
import com.unir.component.LoanTicket;
import com.unir.configuration.ConnectionProperties;
import com.unir.model.Book;
import com.unir.model.Shelf;
import com.unir.service.CatalogService;
import com.unir.service.LombokCatalogService;
import com.unir.service.NotificationService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class LibraryController {

    private final CatalogService catalogService;
    private final LombokCatalogService lombokCatalogService;
    private final NotificationService notificationService;
    private final LibraryInfoComponent libraryInfo;
    private final Shelf fictionShelf;
    private final Shelf scienceShelf;
    private final Book novelBook;
    private final Book scienceBook;
    private final ConnectionProperties connectionProperties;
    private final ApplicationContext context;

    public LibraryController(
            CatalogService catalogService,
            LombokCatalogService lombokCatalogService,
            NotificationService notificationService,
            LibraryInfoComponent libraryInfo,
            @Qualifier("fictionShelf") Shelf fictionShelf,
            @Qualifier("scienceShelf") Shelf scienceShelf,
            @Qualifier("novelBook") Book novelBook,
            @Qualifier("scienceBook") Book scienceBook,
            ConnectionProperties connectionProperties,
            ApplicationContext context) {
        this.catalogService = catalogService;
        this.lombokCatalogService = lombokCatalogService;
        this.notificationService = notificationService;
        this.libraryInfo = libraryInfo;
        this.fictionShelf = fictionShelf;
        this.scienceShelf = scienceShelf;
        this.novelBook = novelBook;
        this.scienceBook = scienceBook;
        this.connectionProperties = connectionProperties;
        this.context = context;
    }

    @GetMapping("/library")
    public Map<String, Object> library(@RequestParam(defaultValue = "Java") String keyword) {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Inyección por constructor
        result.put("1_constructor_injection", catalogService.search(keyword));

        // 2. Inyección por constructor con Lombok
        result.put("2_lombok_constructor", lombokCatalogService.search(keyword));

        // 3. Inyección por setter
        result.put("3_setter_injection", notificationService.getNotice());

        // 4. Inyección por @Value (dentro de LibraryInfoComponent)
        result.put("4_value_injection", libraryInfo.getDescription());

        // 5. Bean definido en @Configuration (Shelf con Book inyectado)
        result.put("5_configuration_bean", fictionShelf.toString());

        // 6. @Qualifier: elegir entre Beans del mismo tipo
        result.put("6_qualifier_novel_book", novelBook.toString());
        result.put("6_qualifier_science_book", scienceBook.toString());
        result.put("6_qualifier_fiction_shelf", fictionShelf.toString());
        result.put("6_qualifier_science_shelf", scienceShelf.toString());

        // 7. @ConfigurationProperties: bloque completo del yml mapeado a un objeto
        result.put("7_config_properties_summary", connectionProperties.getSummary());
        result.put("7_config_properties_host", connectionProperties.getHost());
        result.put("7_config_properties_port", connectionProperties.getPort());
        result.put("7_config_properties_auth_user", connectionProperties.getAuth().getUser());

        // 8. Scope prototype: cada llamada a getBean crea una nueva instancia
        LoanTicket ticket1 = context.getBean(LoanTicket.class);
        LoanTicket ticket2 = context.getBean(LoanTicket.class);
        result.put("8_prototype_ticket_1", ticket1.getTicketId());
        result.put("8_prototype_ticket_2", ticket2.getTicketId());
        result.put("8_prototype_are_same", ticket1 == ticket2); // siempre false

        return result;
    }
}
```

