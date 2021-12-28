FROM php:8.0-apache
RUN apt-get update
RUN apt-get install -y libzip-dev zip && docker-php-ext-install zip
RUN a2enmod rewrite headers authz_core mime expires deflate setenvif filter
