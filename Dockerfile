FROM odoo:16

# Copy custom modules into the Odoo addons directory
COPY ./ /mnt/extra-addons

# Set permissions so Odoo can access the files
RUN chown -R odoo:odoo /mnt/extra-addons

# Expose Odoo's default port
EXPOSE 8069
