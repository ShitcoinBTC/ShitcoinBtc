package=openssl
$(package)_version=3.0.16
$(package)_download_path=https://www.openssl.org/source/
$(package)_file_name=$(package)-$($(package)_version).tar.gz
$(package)_sha256_hash=57e03c50feab5d31b152af2b764f10379aecd8ee92f16c985983ce4a99f7ef86

# OpenSSL's Configure wants an explicit target and cross-compile prefix.
# We only need the static libssl/libcrypto for the vault BTC-explorer TLS
# client; skip shared libs, tests and docs to keep the build lean.
define $(package)_set_vars
  $(package)_config_opts=--prefix=$($($(package)_type)_prefix)
  $(package)_config_opts+=--openssldir=$($($(package)_type)_prefix)/etc/ssl
  $(package)_config_opts+=--libdir=lib
  $(package)_config_opts+=no-shared no-tests no-capi
endef

define $(package)_config_cmds
  ./Configure mingw64 --cross-compile-prefix=$(host)- $($(package)_config_opts)
endef

define $(package)_build_cmds
  $(MAKE)
endef

define $(package)_stage_cmds
  $(MAKE) DESTDIR=$($(package)_staging_dir) install_sw
endef
