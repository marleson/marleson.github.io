source "https://rubygems.org"

# Site publicado pelo GitHub Pages.
# A gem "github-pages" fixa as mesmas versões do Jekyll e dos plugins usados
# pelo GitHub, garantindo que o que você vê localmente é o que vai ao ar.
#
#   bundle install                  # instala as dependências
#   bundle exec jekyll serve        # servidor local em http://localhost:4000
#   bundle update github-pages      # atualiza para a versão mais recente
#
gem "github-pages", "~> 232", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-include-cache"   # exigido pelo tema Minimal Mistakes
  gem "jekyll-remote-theme"    # carrega o tema direto do GitHub
end

# Gems que deixaram de vir junto com o Ruby 3.x/3.4+ mas o Jekyll 3 precisa
gem "webrick"
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"
gem "faraday-retry"

# Windows e JRuby não incluem os arquivos de fuso horário
platforms :windows, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Melhora o "watch" de diretórios no Windows
gem "wdm", "~> 0.1", platforms: [:windows]
