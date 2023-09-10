FROM php:8.2-apache

# setup PHP
RUN apt-get update && apt-get install -y libzip-dev zip && \
    a2enmod rewrite headers authz_core mime expires deflate setenvif filter && \
    docker-php-ext-install zip && \
    echo 'post_max_size=64M' >> /usr/local/etc/php/php.ini && \
    echo 'upload_max_filesize=64M' >> /usr/local/etc/php/php.ini

# setup FBG (use .tar.gz - requires 'gulp release' first)
ADD dist/FreeBeeGee-current.tar.gz /var/www/html/
RUN mv /var/www/html/FreeBeeGee/* /var/www/html/FreeBeeGee/.[!.]* /var/www/html/ && \
    rmdir /var/www/html/FreeBeeGee/ && \
    cp /var/www/html/.htaccess_full /var/www/html/.htaccess && \
    echo '#!/bin/bash' >> /app.sh && \
    echo 'chown -R www-data:www-data /var/www/html/' >> /app.sh && \
    echo 'if [[ "$FBGPASS" == "" ]]; then FBGPASS=`head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16` ; fi' >> /app.sh && \
    echo 'BCRYPT=`htpasswd -bnBC 12 "" "$FBGPASS" | tr -d ":\\n"`' >> /app.sh && \
    echo 'sed -i "s/\$2y\$12\$ZLUoJ7k6JODIgKk6et8ire6XxGDlCS4nupZo9NyJvSnomZ6lgFKGa/${BCRYPT//\//\\\/}/g" /var/www/html/api/data/server.json' >> /app.sh && \
    echo 'apache2-foreground' >> /app.sh && \
    chmod +x /app.sh

CMD ["/app.sh"]
