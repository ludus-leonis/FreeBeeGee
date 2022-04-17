FROM php:8.1-apache

# setup PHP
RUN apt-get update && apt-get install -y libzip-dev zip && \
    a2enmod rewrite headers authz_core mime expires deflate setenvif filter && \
    docker-php-ext-install zip
RUN echo 'post_max_size=32M' >> /usr/local/etc/php/php.ini && \
    echo 'upload_max_filesize=32M' >> /usr/local/etc/php/php.ini
