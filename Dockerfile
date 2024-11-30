FROM odoo:16

# Create the /mnt/extra-addons directory if it doesn't exist
RUN mkdir -p /mnt/extra-addons

# Set permissions so Odoo can access the files
RUN chown -R odoo:odoo /mnt/extra-addons

# Copy custom modules into the /mnt/extra-addons directory
COPY ./ /mnt/extra-addons

# Expose Odoo's default port
EXPOSE 8069

# Set the entry point for Odoo
ENTRYPOINT ["odoo"]

# Define the command to start Odoo
CMD ["--addons-path=/mnt/extra-addons"]
