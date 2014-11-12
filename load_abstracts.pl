#!/opt/local/bin/perl -w

use strict;
use XML::Twig;
use JSON;
use Search::Elasticsearch;
use Try::Tiny;


my $e = Search::Elasticsearch->new(
    #nodes => ['192.168.59.103:9200']
    nodes => ['localhost:9200']
);
my $twig = XML::Twig->new(
    twig_handlers => {
        row => \&submit_abstract
    }
);
#$twig->parsefile('data/RePORTER_PRJABS_X_FY2014_170.xml');
#$twig->parsefile('data/RePORTER_PRJABS_X_FY2013.xml');
my @files = glob("data/RePORTER_PRJABS_X_FY*.xml");
for my $file (@files) {
    $twig->parsefile($file);
}

sub submit_abstract {
    my ($t, $row) = @_;
    my $application_id = $row->first_child('APPLICATION_ID')->text;
    my $data = {
        abstract => $row->first_child('ABSTRACT_TEXT')->text,
    };
    try {
        $e->update(
            index => 'nih',
            type => 'full',
            id => $application_id,
            body => {doc => $data}
        );
    } catch {
        warn "caught error: $_";
    };
    $t->purge;
}
